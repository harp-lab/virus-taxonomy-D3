SQL used by the Taxonomy Visualization code

- The Taxonomy Visualization code depends on taxonomy data exported as JSON files.

- There are 2 different JSON files for each MSL release: one for species taxa, and the other for all non-species taxa.

- The non-species taxa JSON contains hidden/unsassigned/ghost nodes for ranks between assigned taxa that do not have an entry in the ICTV taxonomy_node table.

- All assigned and unassigned taxa nodes are stored in the "taxon_json" table, which is created by running the createTaxonJsonTable.sql script.

- The "v_taxon_rank" view provides a numeric identifier (rank_index) for all ranks in taxonomy_level such that the rank_index is always the parent rank_index + 1 (level_id in taxonomy_level differs from the parent level_id by an integer <= 100).

- The "v_taxon_rank" view is created by running the createTaxonRankView.sql script.
