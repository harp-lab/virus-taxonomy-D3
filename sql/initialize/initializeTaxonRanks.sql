
-- TODO: consider using a cursor over all tree IDs that aren't already
-- represented in taxon_rank
DECLARE @treeID AS INT = 202100000

INSERT INTO [dbo].[taxon_rank] (
level_id,
rank_index,
rank_name,
tree_id
)

SELECT 
	level_id,
	ROW_NUMBER() OVER(ORDER BY level_id ASC) - 1 AS rank_index,
	name as rank_name,
	@treeID as tree_id
	
FROM (
	SELECT DISTINCT tn.level_id
	FROM taxonomy_node tn
	WHERE tn.tree_id = @treeID
	--AND tn.tree_id <> tn.taxnode_id
) levels
JOIN taxonomy_level tl ON tl.id = levels.level_id
ORDER BY levels.level_id
