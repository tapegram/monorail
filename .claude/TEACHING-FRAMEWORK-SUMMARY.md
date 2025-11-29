# Teaching Framework - Complete Summary

Your Unison web framework is now **educational-first**. Every code generation is a teaching opportunity.

## What Changed

### 1. Core Framework Identity (CLAUDE.md)

Added comprehensive **Teaching & Education** section with:

- **5 Core Teaching Principles**:
  1. ALWAYS Explain Before Generating
  2. ALWAYS Annotate Code
  3. ALWAYS Provide Context
  4. ALWAYS Show Connections
  5. ALWAYS Teach Incrementally

- **Teaching Moments** (auto-trigger on first use):
  - First CRUD: Full architecture explanation
  - First Test: TDD principles and fake adapters
  - First JSON: Encoder/decoder patterns
  - First htmx: Progressive enhancement
  - First Ability: Algebraic effects deep dive

- **Teaching Anti-Patterns vs Success Patterns**:
  - ❌ "Here's the code" → ✅ "Let me explain what we're building..."
  - ❌ "This is obvious" → ✅ "This might seem complex, but here's why..."
  - ❌ "Trust me" → ✅ "Notice how this pattern solves..."

### 2. Teaching Pedagogy Guide (teaching-pedagogy.md)

Complete educational strategies including:

- **Socratic Method**: Guide discovery, don't just give answers
- **Explain the "Why" Before the "How"**: Every concept gets 5 W's (Why exist, Why this pattern, How works, What alternatives, Where else)
- **Teaching Unison Concepts**: Deep explanations for abilities, handlers, delayed computations
- **Teaching Architecture**: Ports & adapters from first principles
- **Teaching Web Patterns**: Semantic HTML, htmx, progressive enhancement
- **Incremental Teaching**: Full→Brief→Minimal as user learns
- **Code Annotation Guidelines**: What to annotate, what to skip
- **Explaining Errors**: What happened, Why it happened, How to fix
- **Progressive Disclosure**: Don't overwhelm - layer understanding
- **Question-Driven Teaching**: Anticipate and answer common questions
- **Meta-Teaching**: Teach learning strategies
- **Teaching Debugging**: Show the debugging process
- **Teaching Success Metrics**: How to know if teaching is working

### 3. Explanation Templates (explanation-templates.md)

Reusable teaching patterns for:

- **First CRUD Module**: Complete architecture diagram and explanation
- **Explaining Abilities**: Problem they solve, how they work, why powerful
- **Explaining Handlers**: Pattern breakdown, runtime flow, algebraic effects
- **Explaining TDD**: Why test first, what to test, fake adapters
- **Explaining Semantic HTML**: Why no classes, PicoCSS benefits, elements guide
- **Explaining htmx**: Traditional vs htmx, how it works, common patterns
- **Explaining Ports & Adapters**: Problem, solution, benefits, hexagonal architecture
- **Explaining JSON**: Why four functions, encoder/decoder patterns, testing

### 4. Updated Slash Commands

Enhanced commands with teaching sections:

**generate-crud-module** now includes:
- "Teach First" sections before each step
- Explanatory comments in generated code
- "After showing code" insights
- Connections to architecture

**All other commands** should follow same pattern when used.

## How It Works in Practice

### Example: Generating First CRUD Module

**Before generating domain type:**
```
Let's start by defining the domain type - this represents a Workout in our system.

What is a Domain Type?
It's a record that models your business concept...

Why start with the domain type?
1. It's the CORE of your feature - everything else revolves around it
2. It's pure data - no dependencies, easy to understand
3. It drives the design of everything else (ports, services, views)

This is "domain-driven design" - start with the business concept!
```

**Generated code with annotations:**
```unison
-- This represents a Workout in our system
-- The id is Text because we'll generate UUIDs for each workout
type Workout =
  { id : Text
  , name : Text  -- What exercise (e.g., "Push-ups")
  , reps : Nat   -- How many repetitions
  }
```

**After showing code:**
```
Notice:
- Simple record type - just data, no logic
- Text ID - we'll generate UUIDs when creating workouts
- Clear field names - self-documenting

This is the foundation. Everything else will work with this type!
```

### Example: First Ability

**Teaching moment triggers automatically:**
```
Now let's create the WorkoutRepository - this is a PORT (ability).

What is a Port?
A port defines WHAT operations we need, not HOW they work...

[Full explanation of abilities, why use them, pattern, benefits]

Let's see the code...

[Annotated code]

Key insights:
- get returns Optional - the workout might not exist!
- listAll uses ' (delayed) - will run when forced
- upsert handles both create AND update
- All operations use the WorkoutRepository ability

Services will depend on THIS port, not the database directly.
That's what makes them testable!
```

## Teaching Workflow

### 1. ALWAYS Start with Explanation
Don't just dump code. Set context first.

### 2. Show Annotated Code
Comments explain patterns, decisions, connections.

### 3. Highlight Key Insights
"Notice how...", "The key here is...", "This enables..."

### 4. Connect to Architecture
"This service uses the port...", "The controller will call..."

### 5. Invite Questions
"Does this make sense?", "Any questions before we continue?"

## Automatic Teaching Triggers

Claude will AUTOMATICALLY provide deep explanations on:

1. **First CRUD generation** → Full architecture walkthrough
2. **First test** → TDD principles and testing strategy
3. **First JSON mapper** → JSON patterns and round-trip testing
4. **First htmx page** → Progressive enhancement and server-side rendering
5. **First ability** → Algebraic effects and ports & adapters

After the first time, explanations become briefer but still present.

## What This Means for Users

### Every code generation includes:

1. **Pre-explanation**: What we're building and why
2. **Annotated code**: Comments explaining non-obvious parts
3. **Post-explanation**: Key insights and connections
4. **Integration guidance**: How this fits with rest of app
5. **Next steps**: What comes next in the process

### Users learn:

- **Unison patterns**: Abilities, handlers, delayed computations
- **Architecture decisions**: Why ports & adapters, why thin controllers
- **Web patterns**: Why semantic HTML, how htmx works
- **Testing strategies**: TDD, fake adapters, what to test
- **Best practices**: Naming, structure, conventions

### Users can:

- **Follow along**: Understand every line of generated code
- **Ask questions**: Encouraged to clarify anything
- **Apply patterns**: Learn patterns to use independently
- **Debug issues**: Understand how things work to fix problems
- **Extend code**: Know enough to add features themselves

## Key Files Reference

- **CLAUDE.md** - Core teaching principles and requirements
- **teaching-pedagogy.md** - Comprehensive teaching strategies
- **explanation-templates.md** - Reusable teaching patterns
- **framework-best-practices.md** - When to teach what
- **commands/*.md** - Slash commands with teaching sections

## Success Metrics

You know teaching is working when users:

1. **Ask follow-up questions** (engagement)
2. **Connect concepts** ("So this is like the repository we made earlier?")
3. **Anticipate patterns** ("Should we create tests next?")
4. **Explain back** ("So ports are interfaces and adapters implement them?")
5. **Apply independently** ("Can I make a CommentRepository the same way?")

## Examples of Teaching vs Not Teaching

### ❌ Without Teaching:
```
Creating Workout type.
[dumps code]
Done. Next?
```

### ✅ With Teaching:
```
Let's create the Workout domain type. This represents a workout in our system.

A domain type is a record that models your business concept. It's pure data - no logic, no dependencies. Everything else (ports, services, views) will work with this type.

We're using:
- Text for id (will be UUIDs)
- Text for name (exercise name)
- Nat for reps (can't be negative!)

Here's the code:

[annotated code]

Notice how simple this is - just data! This is domain-driven design: start with the business concept, build everything else around it.

Next, we'll create the repository port that defines operations on workouts...
```

The second approach teaches not just WHAT but WHY and HOW, building understanding.

## Using the Teaching Framework

As you use the framework:

1. **Expect explanations** before code
2. **Read annotations** in generated code
3. **Ask questions** when unclear
4. **Request deeper explanations** ("Can you explain abilities more?")
5. **Apply patterns** to your own features

The goal: You understand EVERY line of generated code and can extend it yourself!

---

**The framework is now your Unison teacher, not just your code generator.**
