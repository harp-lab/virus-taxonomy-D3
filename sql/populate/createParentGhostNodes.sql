
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 09/19/22
-- Description: Create ghost nodes in the taxon JSON table between top-level nodes and the tree node.
-- Updated: 
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.createParentGhostNodes') IS NOT NULL
	DROP PROCEDURE dbo.createParentGhostNodes
GO

CREATE PROCEDURE dbo.createParentGhostNodes
	@treeID AS INT

AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

	-- A constant error code to use when throwing exceptions.
	DECLARE @errorCode AS INT = 50000

	BEGIN TRY
		
		--==========================================================================================================
		-- Get the taxon_json.id of the tree node
		--==========================================================================================================
		DECLARE @treeJsonID AS INT = (
			SELECT TOP 1 id
			FROM taxon_json tj
			WHERE tj.tree_id = @treeID
			AND tj.rank_index = 0
		)
		IF @treeJsonID IS NULL THROW @errorCode, 'Invalid taxon_json.id for tree node', 1

		-- What is the lowest (highest rank index) parent ghost node rank?
		DECLARE @lowestRankToCreate AS INT = (
			SELECT MAX(rank_index) - 1
			FROM taxon_json
			WHERE parent_taxnode_id = @treeID	-- Child nodes of the tree node.
			AND taxnode_id <> @treeID			-- Exclude the tree node
			AND is_ghost_node = 0
			AND rank_index > 1					-- Exclude realm (and tree)
		)

		DECLARE @currentRankIndex AS INT = 1
		DECLARE @previousID AS INT = @treeJsonID

		--==========================================================================================================
		-- Create parent ghost nodes
		--==========================================================================================================
		WHILE @currentRankIndex <= @lowestRankToCreate
		BEGIN
			
			-- Create a ghost node for this rank.
			INSERT INTO taxon_json (
				is_ghost_node,
				parent_distance,
				parent_taxnode_id,
				parent_id,
				rank_index,
				[source],
				taxnode_id,
				tree_id
			) VALUES (
				1, -- This is a ghost node.
				1, -- Ghost nodes are always 1 rank away from their parent node.
				@treeID,
				@previousID,
				@currentRankIndex,
				'P', -- parent ghost node
				NULL,
				@treeID
			)
	
			-- The ID of the taxon_json record we just created.
			SET @previousID = (SELECT SCOPE_IDENTITY() AS [SCOPE_IDENTITY])
			
			SET @currentRankIndex = @currentRankIndex + 1
		END


		-- Variables used by the WHILE loop.
		DECLARE @id AS INT
		DECLARE @parentID AS INT

		--==========================================================================================================
		-- Declare a cursor for a query that retrieves all top level nodes without parents
		--==========================================================================================================
		DECLARE top_level_cursor CURSOR FOR 

			SELECT 
				notghost.id,
				parent_id = (
					SELECT TOP 1 id
					FROM taxon_json ghost
					WHERE ghost.is_ghost_node = 1
					AND ghost.[source] = 'P' -- This is a "parent" ghost node
					AND ghost.rank_index = notghost.rank_index - 1
					AND ghost.parent_taxnode_id = @treeID
				)

			FROM taxon_json notghost
			WHERE notghost.parent_taxnode_id = @treeID	-- Child nodes of the tree node.
			AND notghost.taxnode_id <> @treeID			-- Exclude the tree node
			AND notghost.is_ghost_node = 0				-- No ghost nodes
			AND notghost.rank_index > 1					-- Exclude realm (and tree)

		OPEN top_level_cursor  
		FETCH NEXT FROM top_level_cursor INTO @id, @parentID

		WHILE @@FETCH_STATUS = 0  
		BEGIN
		
			-- Connect the "top-level" node to its parent ghost node.
			UPDATE taxon_json SET parent_id = @parentID WHERE id = @id
			
			FETCH NEXT FROM top_level_cursor INTO @id, @parentID
		END 

		CLOSE top_level_cursor  
		DEALLOCATE top_level_cursor

	END TRY
	BEGIN CATCH
		DECLARE @errorMsg AS VARCHAR(200) = ERROR_MESSAGE()
		RAISERROR(@errorMsg, 18, 1)
	END CATCH 
END