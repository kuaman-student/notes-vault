---
title: "Prompt Engineering & In-Context Learning for AI"
category: "AI & Machine Learning"
tags: ["LLM", "Prompting", "FewShot", "ChainOfThought"]
difficulty: "Beginner"
---

# Prompt Engineering & In-Context Learning for AI

Prompt engineering is the empirical discipline of structuring text queries to elicit desired behaviors from Large Language Models (LLMs).

---

## 1. Zero-Shot vs Few-Shot Prompting

- **Zero-Shot**: Giving the model a task directly without examples.
- **Few-Shot**: Giving the model 2-5 demonstration input-output pairs before the query.

### Chain-of-Thought (CoT) Prompting
Encourages the model to generate intermediate reasoning steps before arriving at the final answer:

> "Let's think step by step." (Kojima et al., 2022)

```text
Q: A cafeteria had 23 apples. If they used 20 to make lunch and bought 6 more, how many apples do they have?
A: Let's think step by step.
1. The cafeteria started with 23 apples.
2. They used 20 apples, leaving 23 - 20 = 3 apples.
3. They bought 6 more apples, giving 3 + 6 = 9 apples.
Therefore, the answer is 9.
```

---

## 2. Parameter Tuning for Generation

| Parameter | Function | Typical Value |
| :--- | :--- | :--- |
| **Temperature** | Controls randomness of softmax probability distribution | 0.2 (Code/Math), 0.8 (Creative) |
| **Top-P (Nucleus)** | Samples from top cumulative probability mass | 0.9 |
| **Frequency Penalty** | Decreases probability of repeating identical tokens | 0.0 - 0.5 |
