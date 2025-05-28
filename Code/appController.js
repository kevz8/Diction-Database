const express = require('express');
const appService = require('./appService');

const router = express.Router();

// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});

router.get('/dictionary', async (req, res) => {
    const tableContent = await appService.fetchWordsFromDb();
    res.json({data: tableContent});
});

router.get('/language', async (req, res) => {
    const tableContent = await appService.fetchLanguageFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-dictionary", async (req, res) => {
    const initiateResult = await appService.initiateDictionary();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/find-definition", async (req, res) => {
    const { word } = req.body;
    const definition = await appService.findDefinition(word);
    if (definition) {
        res.json({ success: true, definition });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/search-words", async (req, res) => {
    try {
        const { queries } = req.body;
        const words = await appService.searchWord(queries);
        if (words) {
            res.json({ success: true, words });
        } else {
            res.status(500).json({ success: false });
        }
    } catch (err) {
        res.status(500).json({ success: false });
        console.log(err);
    }
});

router.post("/delete-word", async (req, res) => {
    const { word } = req.body;
    const getResult = await appService.deleteWord(word);
    if (getResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/add-context", async (req, res) => {
    const { word, sentence, sentenceSource, definition, lexicalCategory, region, ethnicGroups, languageFamily, wordOrder, language, ancestor } = req.body;
    const insertResult = await appService.addContext(word, sentence, sentenceSource, definition, lexicalCategory, region, ethnicGroups, languageFamily, wordOrder, language, ancestor);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/update-language-context", async (req, res) => {
    const { key, updateAttribute, newData } = req.body;
    const updateResult = await appService.updateLanguageContext(key, updateAttribute, newData);

    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/language-context", async (req, res) => {
    const { attribute } = req.body;
    const data = await appService.getLanguageContext(attribute);

    if (data) {
        res.json({ success: true, data });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/count-demotable', async (req, res) => {
    const data = await appService.countWords();
    if (data) {
        res.json({ 
            success: true,  
            data
        });
    } else {
        res.status(500).json({ 
            success: false
        });
    }
});

router.get('/count-demotable1', async (req, res) => {
    const data = await appService.countWords1();
    if (data) {
        res.json({ 
            success: true,  
            data
        });
    } else {
        res.status(500).json({ 
            success: false
        });
    }
});

router.get('/count-demotable2', async (req, res) => {
    const data = await appService.countWords2();
    if (data) {
        res.json({ 
            success: true,  
            data
        });
    } else {
        res.status(500).json({ 
            success: false
        });
    }
});

router.get('/division-table', async (req, res) => {
    const data = await appService.division();
    if (data) {
        res.json({ 
            success: true,  
            data
        });
    } else {
        res.status(500).json({ 
            success: false
        });
    }
});

module.exports = router;