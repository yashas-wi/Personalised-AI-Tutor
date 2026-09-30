# NLP Basics

## What is Natural Language Processing?

Natural Language Processing (NLP) is the branch of AI that deals with the interaction between computers and human language. Tasks range from simple string matching to complex understanding of meaning, sentiment, and intent. Core NLP challenges arise from language's inherent ambiguity, context-dependence, and cultural nuance — the same word can mean different things in different contexts, and the same meaning can be expressed in infinitely many ways.

The standard NLP pipeline begins with **text preprocessing**: removing noise (HTML tags, punctuation for some tasks), lowercasing, **tokenisation** (splitting text into individual units — words, subwords, or characters), and optional **stemming/lemmatisation** (reducing words to their base form). Tokenisation is more nuanced than it first appears: "don't" should become ["do", "n't"], and multi-lingual models must handle scripts without word boundaries (Chinese, Japanese).

## Text Representation: From Bag-of-Words to Embeddings

The fundamental challenge of NLP is representing text as numbers that a model can process.

**Bag-of-Words (BoW)** represents a document as a count vector over the vocabulary. It ignores word order but captures word frequency. **TF-IDF (Term Frequency-Inverse Document Frequency)** weights terms by how frequently they appear in a document relative to the corpus, downweighting common stopwords and upweighting discriminative terms: *TF-IDF(t, d) = TF(t, d) × log(N / df(t))*.

**Word2Vec** (Mikolov et al., 2013) learns dense vector representations (**word embeddings**) by training a shallow neural network on a self-supervised task: either predicting a word from its context (Continuous Bag-of-Words, CBOW) or predicting context words from a target word (Skip-gram). The resulting 100-300 dimensional vectors capture semantic relationships: *king - man + woman ≈ queen*. Related methods include **GloVe** (Global Vectors, learns from global co-occurrence statistics) and **FastText** (represents words as sums of character n-gram vectors, handling out-of-vocabulary words).

The key limitation of these static embeddings is that each word has a single vector regardless of context. "Bank" has one embedding whether it means a financial institution or a river bank.

## Sentiment Analysis and Classification

**Sentiment analysis** classifies text by sentiment polarity (positive/negative/neutral) and is one of the most common NLP applications in industry (product reviews, social media monitoring, customer service). Classical approaches use TF-IDF features with logistic regression or SVMs. Modern approaches fine-tune pre-trained language models like BERT, achieving near-human performance on benchmark datasets.

**Text classification** generalises sentiment analysis to any label set: spam detection, topic categorisation, intent recognition in dialogue systems. The workflow is:
1. Tokenise and encode text (TF-IDF, embeddings, or subword tokens).
2. Pass through a classifier (logistic regression, CNN, RNN, or transformer).
3. Evaluate with accuracy, F1, or multi-label AUC.

**Named Entity Recognition (NER)** is a sequence-labelling task: each token is tagged with an entity type (PERSON, ORGANISATION, LOCATION, DATE). **Part-of-Speech (POS) tagging** assigns grammatical roles. Both are solved with sequence models (BiLSTM-CRF or fine-tuned transformers).
