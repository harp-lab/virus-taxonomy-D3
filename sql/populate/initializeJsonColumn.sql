
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ==========================================================================================================
-- Author: don dempsey
-- Created on: 09/21/22
-- Description: Initialize the taxon_json.json column
-- Updated: 
-- ==========================================================================================================

-- Delete any existing versions.
IF OBJECT_ID('dbo.initializeJsonColumn') IS NOT NULL
	DROP PROCEDURE dbo.initializeJsonColumn
GO

CREATE PROCEDURE dbo.initializeJsonColumn
	@treeID AS INT
AS
BEGIN
	SET XACT_ABORT, NOCOUNT ON

	--==========================================================================================================
	-- Get the rank index of "species".
	--==========================================================================================================
	DECLARE @speciesRankIndex AS INT = (
		SELECT TOP 1 rank_index
		FROM taxon_rank
		WHERE rank_name = 'species'
		AND tree_id = @treeID
	)

	--==========================================================================================================
	-- Update the JSON column of every taxon_json record.
	--==========================================================================================================
	UPDATE tj SET json = 
		'"child_counts":'+CASE
			WHEN tj.child_counts IS NULL OR LEN(tj.child_counts) < 1 THEN 'null' ELSE '"'+tj.child_counts+'"'
		END +','+
		'"has_assigned_siblings":'+CASE
			WHEN ISNULL(tj.has_assigned_siblings, 0) = 0 THEN 'false' ELSE 'true'
		END +','+
		'"has_species":'+CAST(ISNULL(tj.has_species, 0) AS VARCHAR(1))+','+
		'"is_assigned":'+CASE
			WHEN tj.is_ghost_node = 1 THEN 'false' ELSE 'true'
		END +','+
		'"has_unassigned_siblings":'+CASE
			WHEN ISNULL(tj.has_unassigned_siblings, 0) = 0 THEN 'false' ELSE 'true'
		END +','+
		'"name":'+CASE
			WHEN tn.name IS NULL THEN '"Unassigned"' ELSE '"'+tn.name+'"'
		END +','+
		'"parentDistance":'+CAST(ISNULL(tj.parent_distance,1) AS VARCHAR(2))+','+
		'"rankIndex":'+CAST(tj.rank_index AS VARCHAR(2))+','+
		'"rankName":"'+tr.rank_name+'",' +
		'"taxNodeID":'+CASE
			WHEN tj.taxnode_id IS NULL THEN 'null' ELSE CAST(tj.taxnode_id AS VARCHAR(12))
		END +','

	FROM taxon_json tj
	JOIN taxon_rank tr ON (
		tr.rank_index = tj.rank_index
		AND tr.tree_id = @treeID
	)
	LEFT JOIN taxonomy_node tn ON tn.taxnode_id = tj.taxnode_id
	WHERE tj.tree_id = @treeID

	
	-- Variables used by ranked_node_cursor
	DECLARE @id AS INT
	DECLARE @rankIndex AS INT
	DECLARE @taxNodeID AS INT

	--==========================================================================================================
	-- Iterate over all non-species ranks from the lowest (subgenus) to the highest level rank (realm).
	--==========================================================================================================
	DECLARE ranked_node_cursor CURSOR FOR
		
		SELECT 
			tj.id,
			tj.rank_index,
			tj.taxnode_id

		FROM taxon_json tj
		WHERE tj.rank_index < @speciesRankIndex
		AND tj.tree_id = @treeID
		ORDER BY tj.rank_index DESC

	OPEN ranked_node_cursor  
	FETCH NEXT FROM ranked_node_cursor INTO @id, @rankIndex, @taxNodeID

	WHILE @@FETCH_STATUS = 0  
	BEGIN

		-- Populate the taxon_json's "child JSON"
		DECLARE @childJSON AS NVARCHAR(MAX) = (
			SELECT child_json = STRING_AGG(nodeJSON, ',')
			FROM (
				SELECT TOP 10000000 nodeJSON = '{' +
					tj.json +
					'"children":'+ CASE

						-- Don't include species
						WHEN tj.rank_index = @speciesRankIndex THEN 'null'

						-- Use "null" instead of empty JSON (or an actual NULL).
						WHEN tj.child_json IS NULL OR LEN(tj.child_json) < 1 THEN 'null'

						ELSE '['+tj.child_json+']'
					END +
				'}'
				FROM taxon_json tj
				LEFT JOIN taxonomy_node tn ON tn.taxnode_id = tj.taxnode_id
				WHERE tj.parent_id = @id
				AND tj.tree_id = @treeID
				AND tj.rank_index < @speciesRankIndex

				-- We want the higher ranks first (Ex. families before subfamilies), non-ghost nodes 
				-- before ghost nodes, and then sort alphabetically.
				ORDER BY tj.rank_index ASC, tj.is_ghost_node ASC, tn.name ASC
			) childJSON
		)

		-- Update the taxon_json's child JSON column.
		UPDATE taxon_json SET child_json = @childJSON WHERE id = @id


		--==========================================================================================================
		-- Populate the taxon_json's "species JSON"
		--==========================================================================================================
		DECLARE @speciesJSON AS NVARCHAR(MAX) = (
			SELECT species_json = STRING_AGG(nodeJSON, ',')
			FROM (
				SELECT TOP 10000 nodeJSON = CASE
					WHEN tj.taxnode_id IS NULL THEN NULL
					ELSE '{'+tj.json+'"children":null}'
				END
				FROM taxon_json tj
				JOIN taxonomy_node tn ON (
					tn.taxnode_id = tj.taxnode_id
					AND tn.tree_id = tj.tree_id
				)
				WHERE tj.parent_id = @id
				AND tj.tree_id = @treeID
				AND tj.rank_index = @speciesRankIndex
				ORDER BY tn.name ASC
			) speciesResults
		)

		IF LEN(@speciesJSON) > 0 SET @speciesJSON = '['+@speciesJSON+']' ELSE SET @speciesJSON = 'null'
 
		-- Update the taxon_json's species JSON column.
		UPDATE taxon_json SET species_json = @speciesJSON WHERE id = @id


		FETCH NEXT FROM ranked_node_cursor INTO @id, @rankIndex, @taxNodeID
	END 

	CLOSE ranked_node_cursor  
	DEALLOCATE ranked_node_cursor 

END