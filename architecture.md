# EduTwin System Architecture & Engineering Documentation

## 1. High-Level System Architecture

```
+-------------------------------------------------------------------------+
|                              Client Layer                               |
|   Tailwind CSS  *  Lucide Icons  *  Canvas Confetti  *  Reactive SPA    |
+-------------------------------------------------------------------------+
                                    |
                            REST API (JSON)
                                    |
+-------------------------------------------------------------------------+
|                              Server Layer                               |
|   Node.js HTTP Server  *  CORS Middleware  *  Static File Server        |
+-------------------------------------------------------------------------+
        |                                                 |
+-----------------------+                     +-----------------------+
|    AI & Simulation    |                     |    Persistence Engine |
|  - Skill Gap Formula  |                     |  - PBKDF2 Auth & JWT  |
|  - Career Benchmarks  |                     |  - Atomic JSON Store  |
|  - What-If Engine     |                     |  - Seed Data Layer    |
+-----------------------+                     +-----------------------+
```

## 2. Core Mathematical Formulas

### 2.1 Skill Gap Formula
$$\text{Skill Gap} = \max(0, \text{Required Skill Level} - \text{Current Skill Level})$$

Priority Categorization:
- **High (Critical):** $\text{Skill Gap} \ge 35$
- **Medium (Actionable):** $15 \le \text{Skill Gap} < 35$
- **Low (Minor):** $0 < \text{Skill Gap} < 15$
- **Achieved:** $\text{Skill Gap} = 0$

### 2.2 Career Readiness Calculation
$$\text{Readiness} = \left( \sum_{i=1}^n \min\left(1, \frac{\text{Current}_i}{\text{Target}_i}\right) \times W_i \times 100 \right) \times 0.8 + \left( \frac{\text{CGPA}}{\text{Max CGPA}} \times 100 \right) \times 0.2$$

Where:
- $W_i$ is the specific role benchmark weight for skill $i$ (e.g. React: 0.20, Node.js: 0.18, JavaScript: 0.22 for Full Stack).
- 80% weight is given to verified technical competence.
- 20% weight is given to academic health.

### 2.3 What-If Simulation Algorithm
When proposed skill boosts are adjusted via interactive sliders:
1. Merge current skills vector with hypothetical target values.
2. Re-evaluate weighted benchmark alignment deterministically.
3. Compute $\Delta = \text{Simulated Readiness} - \text{Current Readiness}$.
4. Calculate individual skill contributions:
   $$\text{Contribution}_i = \text{Skill Diff}_i \times W_i \times 0.7$$
5. Rank skills by highest return on learning investment.
