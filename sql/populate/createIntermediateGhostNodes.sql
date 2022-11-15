
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ===================================================================================================================
-- Author: don dempsey
-- Created on: 09/19/22
-- Description: Create intermediate ghost nodes for a taxon and its immediate children in the taxon_json table.
-- Updated: 
-- ===================================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.createIntermediateGhostNodes') IS NOT NULL
	DROP PROCEDURE dbo.createIntermediateGhostNodes
GO

CREATE PROCEDURE dbo.createIntermediateGhostNodes
	@childCounts AS NVARCHAR(1000),
	@parentID AS INT,
	@parentRankIndex AS INT,
	@parentTaxnodeID AS INT,
	@treeID AS INT

AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

	-- A constant error code to use when throwing exceptions.
	DECLARE @errorCode AS INT = 50000

	BEGIN TRY
		
		--==========================================================================================================
		-- What's the maximum child rank index we need to create?
		--==========================================================================================================
		DECLARE @maxChildRankIndex AS INT = (
			SELECT MAX(rank_index)
			FROM taxon_json tj
			WHERE tj.parent_taxnode_id = @parentTaxnodeID
			AND tj.is_ghost_node = 0

			-- If the node is immediately below the parent node, there's no need for an intermediate ghost node.
			AND tj.rank_index > @parentRankIndex + 1 
		)

		--==========================================================================================================
		-- If a maximum child rank index wasn't found, we don't need to create intermediate ghost nodes.
		--==========================================================================================================
		IF @maxChildRankIndex IS NULL RETURN


		-- Variables used by the WHILE loop.
		DECLARE @currentRankIndex AS INT = @parentRankIndex + 1
		DECLARE @currentID AS INT
		DECLARE @previousID AS INT = @parentID

		--==========================================================================================================
		-- Create the intermediate ghost nodes between the parent and farthest child.
		--==========================================================================================================
		WHILE @currentRankIndex < @maxChildRankIndex
		BEGIN
			
			INSERT INTO taxon_json (
				child_counts,
				is_ghost_node,
				parent_distance,
				parent_id,
				parent_taxnode_id,
				rank_index,
				[source],
				taxnode_id,
				tree_id
			) VALUES (
				@childCounts,
				1, -- This is a ghost node.
				1, -- Ghost nodes are always 1 rank away from their parent node.
				@previousID,
				@parentTaxnodeID,
				@currentRankIndex,
				'I', -- "Intermediate" ghost node
				NULL,
				@treeID
			)
	
			-- The ID of the taxon_json record we just created.
			SET @currentID = (SELECT SCOPE_IDENTITY() AS [SCOPE_IDENTITY])
			SET @previousID = @currentID

			SET @currentRankIndex = @currentRankIndex + 1
		END
		
		
		-- Variables used by child_cursor
		DECLARE @childID AS INT
		DECLARE @childRankIndex AS INT
		DECLARE @childTaxnodeID AS INT
		
		--==========================================================================================================
		-- Declare a cursor for a query that retrieves all child taxa of the parent node that was provided.
		--==========================================================================================================
		DECLARE child_cursor CURSOR FOR 

			SELECT 
				id,
				rank_index,
				taxnode_id

			FROM taxon_json tj
			WHERE tj.parent_taxnode_id = @parentTaxnodeID
			AND tj.is_ghost_node = 0
			AND tj.rank_index > @parentRankIndex + 1
			ORDER BY tj.rank_index ASC
		
		OPEN child_cursor  
		FETCH NEXT FROM child_cursor INTO @childID, @childRankIndex, @childTaxnodeID

		WHILE @@FETCH_STATUS = 0  
		BEGIN
			
			--==========================================================================================================
			-- Update the child to point to a newly-created ghost node.
			--==========================================================================================================
			UPDATE taxon_json SET parent_id = (
				SELECT TOP 1 id
				FROM taxon_json
				WHERE parent_taxnode_id = @parentTaxnodeID
				AND is_ghost_node = 1
				AND rank_index = @childRankIndex - 1
				AND tree_id = @treeID
			)
			WHERE id = @childID
			
			FETCH NEXT FROM child_cursor INTO @childID, @childRankIndex, @childTaxnodeID
		END 

		CLOSE child_cursor  
		DEALLOCATE child_cursor 
		
	END TRY
	BEGIN CATCH
		DECLARE @errorMsg AS VARCHAR(200) = ERROR_MESSAGE()
		RAISERROR(@errorMsg, 18, 1)
	END CATCH 
END