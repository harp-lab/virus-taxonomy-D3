

/*
DECLARE @treeID AS INT

DECLARE release_cursor CURSOR FORWARD_ONLY FOR

	SELECT tree_id 
	FROM taxonomy_toc 
	WHERE msl_release_num IS NOT NULL
	ORDER BY tree_id

OPEN release_cursor  
FETCH NEXT FROM release_cursor INTO @treeID

WHILE @@FETCH_STATUS = 0  
BEGIN

	EXEC dbo.populateTaxonJSON @treeID = @treeID

	FETCH NEXT FROM release_cursor INTO @treeID

END

CLOSE release_cursor  
DEALLOCATE release_cursor
*/
