# Deep Learning

## Convolutional Neural Networks (CNNs)

Convolutional Neural Networks revolutionised computer vision by exploiting the spatial structure of images. Instead of fully connected layers, CNNs use **convolutional layers** that apply learned filters across the input. A filter (kernel) of size *k×k* slides over the input with a defined stride, computing dot products at each position to produce a **feature map**. This operation is inherently translation-equivariant: a feature detected on the left of an image will produce the same activation if it appears on the right.

Key CNN components include:
- **Convolutional layer**: applies multiple filters to detect local patterns (edges, textures, shapes).
- **Pooling layer**: downsamples spatial dimensions (max-pooling takes the maximum value in each window), reducing computation and introducing translation invariance.
- **Batch normalisation**: normalises layer outputs to have zero mean and unit variance, stabilising training and enabling higher learning rates.
- **Fully connected (dense) layer**: aggregates spatial features for final classification.

Landmark CNN architectures include AlexNet (2012, won ImageNet), VGG (very deep with small 3×3 filters), ResNet (residual skip connections enabling 152+ layer networks), and EfficientNet (scales width, depth, and resolution jointly).

## Recurrent Neural Networks (RNNs) and LSTMs

Standard feedforward networks process each input independently, but many tasks involve **sequential data** where context matters — text, speech, time-series. **Recurrent Neural Networks (RNNs)** maintain a hidden state *h_t* that is updated at each time step: *h_t = tanh(W_h · h_{t-1} + W_x · x_t + b)*. This allows information to flow across time steps.

However, vanilla RNNs suffer from the **vanishing/exploding gradient** problem over long sequences. **Long Short-Term Memory (LSTM)** networks, introduced by Hochreiter & Schmidhuber (1997), address this with a gated cell mechanism:
- **Forget gate**: decides what to discard from the cell state.
- **Input gate**: decides what new information to store.
- **Output gate**: determines the hidden state output.

The cell state *C_t* acts as a memory conveyor, allowing gradients to flow over hundreds of time steps. **Gated Recurrent Units (GRUs)** are a simplified variant with fewer parameters that often performs comparably.

## Advanced Deep Learning Techniques

**Batch Normalisation** normalises each mini-batch's activations to have zero mean and unit variance, then applies learnable scale *γ* and shift *β*. It dramatically accelerates training, acts as a regulariser, and reduces sensitivity to weight initialisation.

**Dropout** randomly zeroes out a fraction *p* of neurons during each forward pass in training, preventing co-adaptation of features and acting as an ensemble of many sparse networks. At inference, all neurons are used but their activations are scaled by *(1-p)*.

Modern **optimisers** go beyond vanilla SGD:
- **Adam**: combines momentum (exponential moving average of gradients) and RMSProp (moving average of squared gradients). Default choice for most deep learning.
- **AdamW**: Adam with decoupled weight decay, the standard for transformer training.
- **SGD with Momentum and LR Scheduling**: still competitive for CNNs when carefully tuned.

**Residual connections** (skip connections), introduced in ResNet, add the layer's input directly to its output: *y = F(x) + x*. This solves the degradation problem in very deep networks and provides identity mappings that make optimisation much easier.
