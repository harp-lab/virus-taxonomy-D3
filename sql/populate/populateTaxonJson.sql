
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ===================================================================================================================
-- Author: don dempsey
-- Created on: 09/22/22
-- Description: Initialize taxon_json from taxonomy_node, create ghost nodes, and initialize JSON for this tree ID.
-- Updated: 
-- ===================================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.populateTaxonJSON') IS NOT NULL
	DROP PROCEDURE dbo.populateTaxonJSON
GO

CREATE PROCEDURE dbo.populateTaxonJSON
	@treeID AS INT

AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

	-- Delete any existing nodes associated with the tree ID.
	DELETE FROM taxon_json WHERE tree_id = @treeID

	-- Create taxon_json records for all taxonomy nodes with the specified tree ID. After all have been created, 
	-- populate the parent ID column for these records.
	EXEC dbo.initializeTaxonJSONFromTaxonomyNode @treeID = @treeID

	-- Create intermediate and parent ghost (hidden/unassigned) nodes.
	EXEC dbo.createGhostNodes @treeID = @treeID

	-- Populate the "has_assigned_siblings" and "has_unassigned_siblings" columns.
	UPDATE tj
	SET has_assigned_siblings = CASE
		WHEN 0 = (
			SELECT COUNT(*)
			FROM taxon_json vs
			WHERE vs.parent_id = tj.parent_id
			AND vs.is_ghost_node = 0
			AND vs.id <> tj.id
			AND vs.rank_index = tj.rank_index
		) THEN 0 ELSE 1
	END,
	has_unassigned_siblings = CASE
		WHEN 0 = (
			SELECT COUNT(*)
			FROM taxon_json hs
			WHERE hs.parent_id = tj.parent_id
			AND hs.is_ghost_node = 1
			AND hs.id <> tj.id
			AND hs.rank_index = tj.rank_index
		) THEN 0 ELSE 1
	END
	FROM taxon_json tj
	WHERE tj.tree_id = @treeID


	-- Populate the JSON column from the bottom to the top of the tree.
	EXEC dbo.initializeJsonColumn @treeID = @treeID


	/*

	Use this when exporting JSON (this example uses a tree ID of 202100000):

	DECLARE @treeID AS INT = 202100000 -- (example tree ID)
	EXEC dbo.exportNonSpeciesTaxonomyJSON @treeID = @treeID
	EXEC dbo.exportSpeciesTaxonomyJSON @treeID = @treeID

	*/

END
