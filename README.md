# project_template
Our project models a dictionary to help language learning, storing words, definitions, IPA transcriptions of the words, the IPA symbols used in the word, and the language they belong to. We also model the IPA itself, keep track of all IPA sounds used in a particular language, and basic information about a language.

Assertions to enforce total participation in many-to-many relationships in the database have been added as comments (line 43-50 in sample_dictionary.sql).

Relations that require ON UPDATE CASCADE contraints for all their foreign keys are noted as comments (38-40 in sample_dictionary.sql).