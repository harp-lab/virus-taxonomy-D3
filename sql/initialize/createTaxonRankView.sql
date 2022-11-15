
-- Delete any existing versions of the view.
IF OBJECT_ID('dbo.v_taxon_rank') IS NOT NULL
	DROP VIEW dbo.v_taxon_rank
GO

CREATE VIEW v_taxon_rank AS

SELECT
	tl.id,
	tl.name,
	rank_index = (ROW_NUMBER() OVER (ORDER BY id)) - 1

FROM taxonomy_level tl
ORDER BY tl.id

