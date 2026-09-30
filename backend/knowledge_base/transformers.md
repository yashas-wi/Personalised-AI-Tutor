# Transformers & Attention Mechanism

## Self-Attention Mechanism
The self-attention mechanism is the foundation of modern Transformer architectures. It allows models to weigh the importance of different tokens in a sequence relative to each other, regardless of their positional distance.
In self-attention, input embeddings are projected into three distinct vectors:
- **Queries (Q)**: What the current token is looking for.
- **Keys (K)**: What each token contains or represents.
- **Values (V)**: The actual information payload retrieved.

The scaled dot-product attention is calculated as:
\text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V
Where $\sqrt{d_k}$ acts as a scaling factor to prevent vanishing gradients during softmax when vector dimensions are large.

## Multi-Head Attention
Instead of performing a single attention function, Multi-Head Attention linearly projects Queries, Keys, and Values $ times with different learned linear projections. This allows the model to jointly attend to information from different representation subspaces at different positions.

## Transformer Architecture
1. **Encoder**: Stacks of Multi-Head Self-Attention layers and Feed-Forward Networks with Residual Connections and Layer Normalization (Post-LN or Pre-LN).
2. **Decoder**: Similar to Encoder, but includes Masked Multi-Head Attention (preventing future token leakage during generation) and Cross-Attention (attending to encoder outputs).
3. **Positional Encoding**: Since self-attention is permutation-invariant, sinusoidal or learned positional embeddings (like RoPE, ALiBi) are added to input token embeddings.
