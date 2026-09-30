# Machine Learning Fundamentals

## What is Machine Learning?

Machine Learning (ML) is a subfield of artificial intelligence that enables computers to learn patterns from data without being explicitly programmed for every task. Instead of hand-crafting rules, we feed examples to algorithms that discover underlying structure on their own. The three major paradigms are **supervised learning** (labelled input-output pairs), **unsupervised learning** (finding hidden structure in unlabelled data), and **reinforcement learning** (learning through reward signals in an environment).

Supervised learning covers the vast majority of industrial ML applications. A model is trained on a dataset of (input **X**, label **y**) pairs and learns a function *f* such that *f(X) ≈ y* for unseen inputs. Common tasks include classification (predicting a discrete class) and regression (predicting a continuous value). Algorithms range from classical methods like linear regression, logistic regression, and decision trees to modern gradient-boosted ensembles (XGBoost, LightGBM) and deep neural networks.

Unsupervised learning discovers natural groupings or compressed representations without labels. **K-Means clustering** partitions data into K groups by minimising within-cluster variance. **Principal Component Analysis (PCA)** finds orthogonal directions of maximum variance, enabling dimensionality reduction. **Autoencoders** learn compact latent representations through an encoder-decoder architecture trained to reconstruct its input.

## Train, Validation, and Test Splits

A fundamental principle is to never evaluate a model on the data it was trained on, as this gives an overly optimistic estimate of real-world performance. The dataset is split into three subsets:

- **Training set** (~70%): used to optimise model parameters.
- **Validation set** (~15%): used to tune hyperparameters and select among candidate models during development.
- **Test set** (~15%): held out until the final evaluation to give an unbiased estimate of generalisation performance.

**Cross-validation** (especially k-fold CV) is used when data is scarce: the training data is split into *k* folds, and the model is trained on *k-1* folds and evaluated on the remaining fold, rotating until every fold has served as the evaluation set. The scores are averaged to give a robust estimate.

## Overfitting, Underfitting, and the Bias-Variance Tradeoff

**Overfitting** occurs when a model learns the training data so precisely—including noise—that it fails to generalise to new data. Signs include a very low training error but a high validation/test error. **Underfitting** occurs when the model is too simple to capture the underlying pattern, resulting in high error on both training and test sets.

The **bias-variance tradeoff** formalises this tension. **Bias** measures how far off predictions are from the true values on average (systematic error from wrong assumptions). **Variance** measures how much the model's predictions vary for different training sets (sensitivity to noise). High-capacity models (many parameters) tend to have low bias but high variance; simpler models tend to have high bias but low variance. The total expected error = Bias² + Variance + Irreducible noise.

Regularisation techniques combat overfitting: **L1 (Lasso)** adds the sum of absolute parameter values to the loss, encouraging sparsity; **L2 (Ridge)** adds the sum of squared parameter values, encouraging small weights. **Dropout**, **early stopping**, and **data augmentation** are additional strategies used in deep learning.

## Key ML Metrics

Choosing the right evaluation metric is crucial. For classification: **accuracy** (fraction correct), **precision** (true positives / predicted positives), **recall** (true positives / actual positives), and **F1-score** (harmonic mean of precision and recall). For imbalanced classes, ROC-AUC (area under the receiver operating characteristic curve) is often preferred. For regression: **Mean Absolute Error (MAE)**, **Mean Squared Error (MSE)**, and **R² (coefficient of determination)**.
