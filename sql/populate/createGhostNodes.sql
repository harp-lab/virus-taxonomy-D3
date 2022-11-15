
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ===================================================================================================================
-- Author: don dempsey
-- Created on: 09/22/22
-- Description: Create intermediate and parent ghost nodes.
-- Updated: 
-- ===================================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.createGhostNodes') IS NOT NULL
	DROP PROCEDURE dbo.createGhostNodes
GO

CREATE PROCEDURE dbo.createGhostNodes
	@treeID AS INT

AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

	-- A constant error code to use when throwing exceptions.
	DECLARE @errorCode AS INT = 50000

	BEGIN TRY

		--==========================================================================================================
		-- Get the rank index of "species".
		--==========================================================================================================
		DECLARE @speciesRankIndex AS INT = (
			SELECT TOP 1 rank_index
			FROM v_taxon_rank
			WHERE name = 'species'
		)

		--==========================================================================================================
		-- Create parent ghost nodes
		--==========================================================================================================
		EXEC dbo.createParentGhostNodes @treeID = @treeID


		-- Variables used by taxon_cursor
		DECLARE @childCounts AS NVARCHAR(1000)
		DECLARE @id AS INT
		DECLARE @rankIndex AS INT
		DECLARE @taxNodeID AS INT

		--==========================================================================================================
		-- Declare a cursor for all non-ghost taxa above "species".
		--==========================================================================================================
		DECLARE taxon_cursor CURSOR FOR 

			SELECT 
				child_counts,
				id,
				rank_index,
				taxnode_id

			FROM taxon_json tj
			WHERE tj.tree_id = @treeID
			AND tj.is_ghost_node = 0
			AND tj.rank_index < @speciesRankIndex
			AND tj.taxnode_id <> @treeID
			ORDER BY tj.rank_index ASC
		
		OPEN taxon_cursor  
		FETCH NEXT FROM taxon_cursor INTO @childCounts, @id, @rankIndex, @taxNodeID

		WHILE @@FETCH_STATUS = 0  
		BEGIN

			--==========================================================================================================
			-- Create intermediate ghost nodes for this taxon (if necessary).
			--==========================================================================================================
			EXEC dbo.createIntermediateGhostNodes
				@childCounts = @childCounts,
				@parentID = @id,
				@parentRankIndex = @rankIndex,
				@parentTaxnodeID = @taxNodeID,
				@treeID = @treeID

			FETCH NEXT FROM taxon_cursor INTO @childCounts, @id, @rankIndex, @taxNodeID
		END 

		CLOSE taxon_cursor  
		DEALLOCATE taxon_cursor 
		
	END TRY
	BEGIN CATCH
		DECLARE @errorMsg AS VARCHAR(200) = ERROR_MESSAGE()
		RAISERROR(@errorMsg, 18, 1)
	END CATCH 
END
