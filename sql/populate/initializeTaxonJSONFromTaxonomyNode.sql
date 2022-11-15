
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 09/21/22
-- Description: Initialize the taxon_json table from the ICTV taxonomy_node table.
-- Updated: 
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.initializeTaxonJSONFromTaxonomyNode') IS NOT NULL
	DROP PROCEDURE dbo.initializeTaxonJSONFromTaxonomyNode
GO

CREATE PROCEDURE dbo.initializeTaxonJSONFromTaxonomyNode
	@treeID AS INT
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON


	-- Delete any existing records for this tree ID.
	DELETE FROM taxon_json WHERE tree_id = @treeID

	-- Add taxonomy node records to the taxon JSON table.
	INSERT INTO taxon_json (
		child_counts,
		child_json,
		has_species,
		is_ghost_node,
		json,
		parent_distance,
		parent_id,
		parent_taxnode_id,
		rank_index,
		[source],
		species_json,
		taxnode_id,
		tree_id
	)
	SELECT
		child_counts,
		child_json = NULL,
		has_species,
		is_ghost_node = 0,
		json = NULL,
		parent_distance = rank_index - ISNULL(parent_rank_index, 0),
		parent_id = NULL,
		parent_taxnode_id,
		rank_index,
		'T',
		species_json = NULL,
		taxnode_id,
		tree_id

	FROM (
		SELECT 
			child_counts = tn.taxa_desc_cts,
			has_species = CASE
				WHEN 0 < (
					SELECT COUNT(*)
					FROM taxonomy_node species
					WHERE species.parent_id = tn.taxnode_id
					AND species.level_id = 600
				) THEN 1 ELSE 0
			END,
			parent_rank_index = ptr.rank_index,
			parent_taxnode_id = tn.parent_id,
			rank_index = tr.rank_index,
			tn.taxnode_id,
			tn.tree_id

		FROM taxonomy_node tn
		JOIN v_taxon_rank tr ON tr.id = tn.level_id
		LEFT JOIN taxonomy_node ptn on ptn.taxnode_id = tn.parent_id
		LEFT JOIN v_taxon_rank ptr ON ptr.id = ptn.level_id
		WHERE tn.tree_id = @treeID
	) taxa


	-- Populate parent taxon_json IDs for child nodes with parent nodes that are one rank above.
	UPDATE tj
	SET tj.parent_id = parent_tj.id
	FROM taxon_json tj
	JOIN taxon_json parent_tj ON (
		parent_tj.taxnode_id = tj.parent_taxnode_id
		AND parent_tj.rank_index = tj.rank_index - 1
		AND parent_tj.id <> tj.id
		AND parent_tj.tree_id = tj.tree_id
	)

END
