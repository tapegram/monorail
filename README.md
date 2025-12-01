# 🚂 Monorail

**A Rails-like web framework for Unison, powered by Claude Code**

Monorail is an opinionated, convention-based web framework that brings Rails-style productivity to Unison development. Built as a Claude Code configuration, it generates clean, testable, production-ready web applications following ports & adapters architecture.

```bash
# Generate a complete web app in seconds
/generate-unison-web-app

# Your app name? MyApp

# ✨ Generated:
#   - Application skeleton (main, routes, deploy)
#   - Ports & adapters architecture
#   - Example route (Hello World)
#   - Page layout with PicoCSS + htmx
#   - Form utilities and web helpers
#   - Deploy functions (dev, stage, prod)
#   - All typechecked and ready to deploy!

# Now add features with:
/generate-crud-module
/generate-page-and-route
/generate-json-mappers
```

---

## 🚀 Quickstart

### Prerequisites
- [Unison](https://www.unison-lang.org/docs/install/) installed
- [Claude Code](https://claude.ai/code) installed
- A Unison Cloud account (for deployment)

### Create Your First App

**1. Open Claude Code in this directory:**
```bash
git clone https://github.com/tapegram/monorail.git
cd monorail
claude
```

**2. Ask Claude to generate your app:**
```
/generate-unison-web-app
```

Claude will prompt you for:
- App name (e.g., `MyApp`)
- Description

**3. In UCM, create the project and install dependencies:**
```
project.create my-app
lib.install @unison/http
lib.install @unison/routes
lib.install @tapegram/html
lib.install @tapegram/htmx
lib.install @unison/json
lib.install @unison/cloud
```

**4. Switch to a feature branch for development:**
```
project.switch my-app/scaffold
```

**5. Load and update the generated code:**
```
load app.u
update
```

**6. Deploy to dev and test:**
```
run deploy.deployDev
```

You now have a working Unison web app deployed to Unison Cloud!

---

```
┌─────────────────────────────────────────────┐
│ HTTP Request │
└─────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────┐
│ Routes (app/routes) │
│ - Parse URL and HTTP method │
│ - Delegate to controller │
└─────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────┐
│ Controllers (app/controllers) │
│ - Parse request params/body │
│ - Call service layer │
│ - Render response (HTML/JSON) │
└─────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────┐
│ Services (app/services) │
│ - ALL business logic │
│ - Depends on PORTS (abilities) │
│ - Pure/testable functions │
└─────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────┐
│ Ports (app/ports) │
│ - Ability definitions │
│ - Abstract interfaces (Repository, etc.) │
└─────────────────────────────────────────────┘
↓
┌─────────────────────────────────────────────┐
│ Adapters (app/adapters) │
│ - Concrete implementations │
│ - Database, HTTP, external services │
└─────────────────────────────────────────────┘

```

### Key Principles

#### 1. **Ports & Adapters**

- **Ports** (abilities) define WHAT your service needs
- **Adapters** (handlers) define HOW it's implemented
- Services depend on ports, never adapters
- Easy to swap implementations (production vs testing)

```unison
-- Port (ability)
ability WorkoutRepository where
  get : Text ->{WorkoutRepository} Optional Workout
  listAll : '{WorkoutRepository} [Workout]

-- Service depends on port
WorkoutService.create : Input ->{WorkoutRepository} Workout

-- Adapter implements port (production)
WorkoutRepository.run : Database -> ... -> {Remote} a

-- Adapter implements port (testing)
WorkoutRepository.fake : Ref [Workout] -> ... -> a
```

#### 2. **Thin Controllers, Fat Services**

- Controllers: Parse request, call service, render response
- Services: ALL business logic
- Keeps business logic testable and reusable

#### 3. **TDD-First**

- Generate tests before or alongside services
- Use fake adapters for fast, isolated tests
- Test services, not infrastructure

#### 4. **Semantic HTML + htmx**

- Server-side rendering (no complex frontend build)
- Progressive enhancement with htmx
- PicoCSS classless styling (no CSS classes needed)
- Fast, accessible, simple

### File Organization

```
monorail/
 .claude/
    commands/          # Slash commands for generation
    skills/            # Framework knowledge & patterns
    templates/         # Code templates
 app/
    routes/            # URL routing
    controllers/       # Request handling
    services/          # Business logic (THE CORE)
    domain/            # Domain types
    ports/             # Ability definitions
    adapters/          # Ability implementations
    pages/             # HTML rendering
    components/        # Reusable HTML
 deploy/                # Deployment functions
 main/                  # Application entry point
 web/                   # Generic web utilities
```

---

## 🧠 Key Concepts

### Abilities (Algebraic Effects)

Unison's abilities are like interfaces but more powerful. They define operations without specifying implementation:

```unison
ability EmailClient where
  sendEmail : Email ->{EmailClient} ()
```

Services depend on abilities:

```unison
UserService.register : Input ->{EmailClient, UserRepository} User
UserService.register input =
  user = createUser input
  UserRepository.save user
  EmailClient.sendEmail (welcomeEmail user)
  user
```

Handlers interpret abilities differently:

```unison
-- Production: actually send emails
EmailClient.run : Config -> '{EmailClient} a -> {Http, Exception} a

-- Testing: collect sent emails
EmailClient.fake : Ref [Email] -> '{EmailClient} a -> a
```

This enables **dependency injection without classes or containers**!

### Convention over Configuration

Monorail makes decisions for you:

- **File structure**: Standard layout for all apps
- **Naming**: `<Entity>Service`, `<Entity>Repository`, `<Entity>Controller`
- **Routing**: RESTful by default (`GET /workouts`, `POST /workouts`, etc.)
- **JSON**: Always four functions (encoder, decoder, encode, decode)
- **Testing**: Services tested with fakes, not real adapters

**Less decisions = more building.**

### Code Generation Strategy

Monorail uses an efficient generation strategy:

1. **Copy templates** (don't regenerate boilerplate)
2. **Edit placeholders** (targeted replacements)
3. **Typecheck** (verify correctness)
4. **Explain** (teach concepts separately)

This saves 70-85% of tokens while generating the same quality code.

---

## 📚 Learn More

### Unison Resources

- **[Unison Language](https://www.unison-lang.org/)** - Official documentation
- **[Unison Share](https://share.unison-lang.org/)** - Package repository
- **[Unison Cloud](https://www.unison.cloud/)** - Deployment platform
- **[Unison Discord](https://discord.gg/unison)** - Community chat

### Architectural Patterns

- **[Ports & Adapters (Hexagonal Architecture)](https://alistair.cockburn.us/hexagonal-architecture/)** - Alistair Cockburn
- **[Algebraic Effects](https://www.eff-lang.org/handlers-tutorial.pdf)** - Understanding effects and handlers
- **[Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)** - Martin Fowler

### Web Stack

- **[htmx](https://htmx.org/)** - High power tools for HTML
- **[PicoCSS](https://picocss.com/)** - Minimal CSS framework
- **[Hypermedia Systems](https://hypermedia.systems/)** - Book on htmx & hypermedia

### Testing

- **[Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)** - TDD fundamentals
- **[London vs Chicago TDD](https://www.thoughtworks.com/en-us/insights/blog/mockists-are-dead-long-live-classicists)** - Testing styles (Monorail uses Chicago style)

---

## 🎓 Learning Path

### 1. Start with the Basics

- Read: `.claude/skills/unison-language-guide.md`
- Generate: Your first web app (`/generate-unison-web-app`)
- Understand: The generated skeleton and architecture

### 2. Add Your First Feature

- Generate: Your first CRUD module (`/generate-crud-module`)
- Study: The generated service and its ports/adapters
- Experiment: Create a fake adapter for testing

### 3. Build More Features

- Generate: A custom page with routing (`/generate-page-and-route`)
- Generate: JSON mappers for an API (`/generate-json-mappers`)
- Add: Tests to your services (`/add-testing-for-service`)

### 4. Go Deeper

- Read: Framework skills in `.claude/skills/`
- Customize: Templates in `.claude/templates/`
- Extend: Create your own slash commands

---

## 🛠️ Development Workflow

### Typical Feature Development

```bash
# 1. Generate the web app (first time)
/generate-unison-web-app
> App name: BlogApp

# 2. Generate a CRUD module for your first feature
/generate-crud-module
> Entity: Post
> Fields: title: Text, body: Text, publishedAt: Optional Instant
> JSON mappers: yes

# 3. Review generated code
# Claude shows you each layer with explanations

# 4. Add tests
/add-testing-for-service
> Service: PostService
> Functions to test: create, publish, delete

# 5. Load into UCM
ucm> load blog-app.u
ucm> load post-crud.u
ucm> update

# 6. Run tests
ucm> test.run PostService.tests

# 7. Deploy
ucm> run deploy.deployStage

# Done! Your feature is live.
```

### Working with Claude

Monorail is built on Claude Code, which means:

- **Ask questions**: "How does the repository adapter work?"
- **Request changes**: "Make the title field required"
- **Get guidance**: "Should I use an ability here?"
- **Learn patterns**: "Explain ports & adapters in this context"

Claude acts as both a code generator AND a teaching assistant.

---

## 🔬 Philosophy

### Why Monorail Exists

**Functional programming is powerful but can be verbose.** Monorail brings the productivity of Rails to the safety of Unison.

**Unison is incredible but has a learning curve.** Monorail provides guardrails and patterns that guide you to good architecture.

**Web frameworks shouldn't require JavaScript.** htmx + server-side rendering gives you interactivity without complexity.

**Testing should be easy.** Ports & adapters + algebraic effects make testing trivial.

**Code generation should teach.** Every generation includes explanations so you learn as you build.

### Design Goals

1. **Productivity**: Generate features in minutes, not hours
2. **Quality**: Every generated feature follows best practices
3. **Learning**: Framework teaches Unison and architecture
4. **Simplicity**: Convention over configuration
5. **Testability**: Easy to test, encouraged by default
6. **Flexibility**: Ports & adapters let you swap implementations

### Non-Goals

- L Being a general-purpose framework (opinionated is good)
- L Supporting multiple frontend frameworks (htmx is enough)
- L Maximizing flexibility (conventions reduce decisions)
- L Enterprise feature bloat (start simple, stay simple)

---

## 🤝 Contributing & Feedback

### Found a Bug?

Open an issue on GitHub:

- Describe what you expected
- Show what actually happened
- Include generated code if relevant

### Have a Suggestion?

We'd love to hear:

- New slash commands you'd find useful
- Architecture improvements
- Documentation enhancements
- Teaching content ideas

**Open a GitHub issue** or reach out on the [Unison Discord](https://discord.gg/unison) - find **@tavishpegram** there!

### Want to Contribute?

Contributions welcome:

- New templates (`.claude/templates/`)
- New skills/guides (`.claude/skills/`)
- New slash commands (`.claude/commands/`)
- Documentation improvements
- Example projects

**Before contributing**: Open an issue to discuss your idea!

---

## 📝 License

[MIT License](LICENSE) - Use freely, commercially or otherwise.

---

## 🙏 Acknowledgments

- **Unison Computing** - For creating Unison and Unison Cloud
- **Anthropic** - For Claude and Claude Code
- **htmx** - For bringing hypermedia back
- **Rails/Django** - For showing the value of opinionated convention-based frameworks.
- **Alistair Cockburn** - For ports & adapters architecture

---

## 🚂 Ready to Build?

```bash
# Clone and start
git clone https://github.com/tapegram/monorail.git
cd monorail
claude-code

# In Claude Code:
/generate-unison-web-app

# Let's build something! 🎉
```

---

**Questions?** Check `.claude/skills/` for detailed guides or ask Claude directly in the editor!

**Stuck?** Open an issue or find @tavishpegram on the Unison Discord.

**Enjoying Monorail?** Star the repo and share with other Unison developers! P
