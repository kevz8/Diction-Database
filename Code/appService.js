const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');
let LEIDVal = 10;

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: envVariables.ORACLE_USER,
    password: envVariables.ORACLE_PASS,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

// initialize connection pool
async function initializeConnectionPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);


// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool 
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}


// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}

async function fetchWordsFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM OrthographicForm');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function fetchLanguageFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM Language_ancestor');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function initiateDictionary() {
    return await withOracleDB(async (connection) => {
        const path = require("path");
        const file = require("fs");

        const sqlPath = path.join(__dirname, 'sample_dictionary.sql');
        const sqlFile = file.readFileSync(sqlPath, 'utf8');
        const queries = sqlFile.replace(/\/\*[\s\S]*?\*\//g, '').split(/\s*?;\s*?/);
        for (const query of queries) {
            try {
                await connection.execute(query);
            } catch(err) {
                console.log('Error setting up Dictionary');
                console.log(query);
                console.log(err);
            }
        }

        return true;
    }).catch(() => {
        return false;
    });
}

async function findDefinition(word) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT led.Definition
            FROM OrthographicForm o, Represents r, LexicalEntry_Definition led
            WHERE o.Spelling = r.Spelling AND led.LEID = r.LEID AND o.Spelling = :word`,
            [word],
            { autoCommit: true }
        );
        if (!result.rows || result.rows.length === 0) {
            return null; // No definition found
        }
        return result.rows[0][0];
    }).catch(() => {
        return false;
    });
}

async function searchWord(queries) {
    const variables = [];
    let query = `SELECT Spelling FROM OrthographicForm WHERE `;

    for (let i = 0; i < queries.length; i++) {
        const { attribute, operation, value } = queries[i];

        if (attribute === 'Num_characters') {
            variables.push(Number(value));
            query += ` ${attribute} = :value${i + 1}`;
        } else {
            variables.push(`%${value}%`);
            query += ` ${attribute} LIKE :value${i + 1}`;
        }

        if (i < queries.length - 1) {
            query += ` ${operation}`;
        }
    }

    return await withOracleDB(async (connection) => {
        const result = await connection.execute(query, variables, { autoCommit: true });

        return result.rows;
    }).catch(() => {
        return false;
    });
}

async function deleteWord(word) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `DELETE FROM OrthographicForm WHERE Spelling = :word`,
            [word],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function addContext(word, sentence, sentenceSource, definition, lexicalCategory, region, ethnicGroups, languageFamily, wordOrder, language, ancestor) {
    return await withOracleDB(async (connection) => {

        try {
            await connection.execute(
                `INSERT INTO Language_family VALUES (:languageFamily, :ancestor)`,
                [languageFamily, ancestor],
                { autoCommit: true }
            );
        } catch (err) {
            // duplicate primary key
        }

        try {
            await connection.execute(
                `INSERT INTO Language_ancestor VALUES (:language, :wordOrder, :languageFamily)`,
                [language, wordOrder, languageFamily],
                { autoCommit: true }
            );
        } catch (err) {
            // duplicate language
        }

        await connection.execute(
            `INSERT INTO Dialect_Uses VALUES (:region, :ethnicGroups, :language)`,
            [region, ethnicGroups, language],
            { autoCommit: true }
        );

        await connection.execute(
            `INSERT INTO LexicalEntry_LexicalCategory VALUES (:lexicalCategory, :definition)`,
            [lexicalCategory, definition],
            { autoCommit: true }
        );

        await connection.execute(
            `INSERT INTO LexicalEntry_Definition VALUES (:LEIDVal, :definition, :region, :ethnicGroups, :language)`,
            [LEIDVal, definition, region, ethnicGroups, language],
            { autoCommit: true }
        );

        const length = word.length;
        await connection.execute(
            `INSERT INTO OrthographicForm VALUES (:word, :length)`,
            [word, length],
            { autoCommit: true }
        );

        await connection.execute(
            `INSERT INTO Represents VALUES (:LEIDVal, :word, :ethnicGroups)`,
            [LEIDVal, word, ethnicGroups],
            { autoCommit: true }
        );

        await connection.execute(
            `INSERT INTO ExampleSentence_Has VALUES (:sentence, :sentenceSource, :LEIDVal)`,
            [sentence, sentenceSource, LEIDVal++],
            { autoCommit: true }
        );

        return true;
    }).catch(() => {
        return false;
    });
}

async function updateLanguageContext(key, updateAttribute, newData) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE Language_ancestor SET ${updateAttribute} = :newData WHERE Name = :key`,
            [newData, key],
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function getLanguageContext(attribute) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT ${attribute} FROM Language_ancestor`,
            [],
            { autoCommit: true }
        );

        return result.rows;
    }).catch(() => {
        return false;
    });
}

async function countWords() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT ld.Language_name, MAX(o.Num_characters) 
            FROM LexicalEntry_Definition ld
            NATURAL JOIN Represents r
            NATURAL JOIN OrthographicForm o
            GROUP BY ld.Language_name`);
        return result.rows;
    }).catch(() => {
        return -1;
    });
}

async function countWords1() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT ld.Language_name, AVG(o.Num_characters) 
            FROM LexicalEntry_Definition ld
            NATURAL JOIN Represents r
            NATURAL JOIN OrthographicForm o
            GROUP BY ld.Language_name
            HAVING COUNT(*) > 1`);
        return result.rows;
    }).catch(() => {
        return -1;
    });
}

async function countWords2() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT ld.Language_name 
            FROM LexicalEntry_Definition ld
            NATURAL JOIN Represents r
            NATURAL JOIN OrthographicForm o
            GROUP BY ld.Language_name
            HAVING AVG(o.Num_characters) > (SELECT AVG(Num_characters) FROM OrthographicForm)`);
        return result.rows;
    }).catch(() => {
        return -1;
    });
}

async function division() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT DISTINCT LD.Language_name
            FROM LexicalEntry_Definition LD
            WHERE NOT EXISTS ((SELECT DISTINCT LL.Lexical_category
                                FROM LexicalEntry_LexicalCategory LL)
                                MINUS (SELECT DISTINCT LL2.Lexical_category
                                        FROM LexicalEntry_Definition LD2, LexicalEntry_LexicalCategory LL2
                                        WHERE LD2.Language_name = LD.Language_name AND LD2.Definition = LL2.Definition))`);
        return result.rows;
    }).catch(() => {
        return -1;
    });
}

module.exports = {
    testOracleConnection,
    fetchWordsFromDb,
    fetchLanguageFromDb,
    initiateDictionary, 
    findDefinition, 
    searchWord,
    deleteWord,
    addContext,
    updateLanguageContext,
    getLanguageContext,
    countWords,
    countWords1,
    countWords2,
    division
};
