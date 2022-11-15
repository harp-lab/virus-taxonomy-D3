
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 07/25/22
-- Description:	Export non-species taxon_json records as JSON for the specified treeID.
-- Updated: 
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.exportNonSpeciesTaxonomyJSON') IS NOT NULL
	DROP PROCEDURE dbo.exportNonSpeciesTaxonomyJSON
GO

CREATE PROCEDURE dbo.exportNonSpeciesTaxonomyJSON
	@treeID AS INT

AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

	SELECT TOP 1 json_result = '{' +
		CAST(tj.json AS VARCHAR(MAX)) +
		',"children":['+ISNULL(CAST(tj.child_json AS VARCHAR(MAX)), '')+']'+
		'}'
	FROM taxon_json tj
	WHERE tj.tree_id = @treeID
	AND tj.taxnode_id = @treeID

END