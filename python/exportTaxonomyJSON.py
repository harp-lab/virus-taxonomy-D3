
import contextlib
import pyodbc
import subprocess



def getMslReleases(apiDB_, dbServer_, taxonomyDB_):

    # TODO: validate parameters!

    # The database connection string
    dbConnectionString = ("Driver={SQL Server Native Client 11.0};"
            f"Server={dbServer_};"
            f"Database={taxonomyDB_};"
            "Trusted_Connection=yes;")

    sql = """
        SELECT tree_id
        FROM taxonomy_toc
        WHERE msl_release_num IS NOT NULL
        ORDER BY tree_id ASC
    """

    # Open the database connection
    with contextlib.closing(pyodbc.connect(dbConnectionString)) as dbConnection:

        cursor = dbConnection.cursor()

        # Iterate over all tree IDs that are returned.
        for row in cursor.execute(sql):
            
            # Get the tree ID as a string.
            treeID = str(row.tree_id)

            # Get the year from the tree ID.
            year = treeID[0:4]

            # Create the command line text to run sqlcmd for non-species taxa.
            nonSpeciesCMD = (f"sqlcmd -S {dbServer_} "
                f"-Q \"EXEC [{apiDB_}].dbo.exportNonSpeciesTaxonomyJSON @treeID = {treeID}\" "
                f"-o \"JSON\\nonSpecies_{year}.json\" "
                "-y 0 ")

            # Run the command
            subprocess.run(nonSpeciesCMD, shell=True)

             # Create the command line text to run sqlcmd for species taxa.
            speciesCMD = (f"sqlcmd -S {dbServer_} "
                f"-Q \"EXEC [{apiDB_}].dbo.exportSpeciesTaxonomyJSON @treeID = {treeID}\" "
                f"-o \"JSON\\species_{year}.json\" "
                "-y 0 ")

            # Run the command
            subprocess.run(speciesCMD, shell=True)





if __name__ == '__main__':
    
    getMslReleases("ICTV_API", "ICTVDEV", "ICTVonline38")