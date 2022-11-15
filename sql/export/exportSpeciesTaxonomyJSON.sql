
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 08/23/22
-- Description:	Export species taxon_json records as JSON for the specified treeID.
-- Updated: 
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.exportSpeciesTaxonomyJSON') IS NOT NULL
	DROP PROCEDURE dbo.exportSpeciesTaxonomyJSON
GO

CREATE PROCEDURE dbo.exportSpeciesTaxonomyJSON
	@treeID AS INT

AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

    SELECT species_lookup = '{'+CAST(species_json AS VARCHAR(MAX))+'}'
    FROM (
        SELECT species_json = STRING_AGG('"'+CAST(tj.taxnode_id AS VARCHAR(12))+'":'+tj.species_json, ',')
        FROM taxon_json tj
        WHERE tj.tree_id = @treeID
        AND tj.has_species = 1
        AND tj.species_json IS NOT NULL 
        AND LEN(tj.species_json) > 0
    ) taxaLookup

END