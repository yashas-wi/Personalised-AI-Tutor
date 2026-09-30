# Neural Networks

## The Biological Inspiration and the Perceptron

Artificial neural networks draw loose inspiration from the brain's neurons, which fire electrical signals when sufficiently stimulated by inputs from neighbouring neurons. The **perceptron**, proposed by Frank Rosenblatt in 1958, is the simplest computational unit: it takes a vector of inputs **x**, computes a weighted sum *z = w·x + b*, and passes it through a step function to produce a binary output. While perceptrons can only learn linearly separable functions (XOR famously fails), stacking them into layers creates the capacity for complex, non-linear mappings.

A **feedforward neural network** (or Multi-Layer Perceptron, MLP) consists of an input layer, one or more hidden layers, and an output layer. Each layer applies a linear transformation followed by a non-linear **activation function**. Popular activations include:

- **ReLU (Rectified Linear Unit)**: *f(z) = max(0, z)* — computationally cheap, avoids the vanishing gradient problem in shallow regions, and is the default for hidden layers in modern networks.
- **Sigmoid**: *f(z) = 1/(1 + e^{-z})* — squashes output to (0,1), used in binary classification output layers.
- **Tanh**: *f(z) = (e^z - e^{-z})/(e^z + e^{-z})* — zero-centred, output in (-1,1), often better than sigmoid for hidden layers.
- **Softmax**: converts raw scores (logits) into a probability distribution summing to 1; used for multi-class output layers.
- **GELU / Swish**: smooth non-linearities used in modern transformers and large language models.

## Weights, Biases, and Forward Pass

Each connection between neurons has an associated **weight** *w* and each neuron has a **bias** *b*. During the **forward pass**, inputs propagate layer by layer: *a^{(l)} = activation(W^{(l)} · a^{(l-1)} + b^{(l)})*. The final layer produces predictions which are compared to the true labels using a **loss function** — cross-entropy for classification, mean squared error for regression.

The entire computation graph is differentiable, which is the key property that enables learning.

## Backpropagation

**Backpropagation** is an efficient algorithm for computing the gradient of the loss with respect to every weight in the network using the chain rule of calculus. Starting from the loss, gradients flow backward through the network layer by layer. For each layer, the weight gradient is the outer product of the upstream gradient and the layer's input activation.

Once gradients are computed, weights are updated using **gradient descent**: *w ← w - η · ∂L/∂w*, where *η* is the learning rate. In practice, **stochastic gradient descent (SGD)** computes gradients on a random mini-batch of data at each step, offering a good trade-off between accuracy and computational efficiency. Modern optimisers like **Adam** (Adaptive Moment Estimation) maintain running averages of gradients and squared gradients to adaptively scale the learning rate per parameter, dramatically speeding up convergence.

## Layers and Architecture Choices

The depth (number of layers) and width (number of neurons per layer) determine model capacity. Deep networks can represent exponentially more functions than shallow networks of the same parameter count, which is the core motivation for **deep learning**. However, very deep networks historically suffered from the **vanishing gradient problem**: gradients shrink exponentially as they propagate through many layers, making early layers learn very slowly. Solutions include careful weight initialisation (Xavier/He initialisation), batch normalisation, and residual connections.
