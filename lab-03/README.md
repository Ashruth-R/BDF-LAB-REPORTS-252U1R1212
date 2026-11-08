# Lab 3: REST API, Query Parameters, Validation, and Debugging

**Student Name**: R Ashruth Rayudu  
**Registration Number**: `252U1R1212`  
**Section**: Core CSE-2D  
**Course**: Backend Development Fundamentals (Year II Term II)  
**Faculty**: Joel Prashanth D / Shiva Sai Teja  
**Repository**: [Ashruth-R/BDF-LAB-REPORTS-252U1R1212](https://github.com/Ashruth-R/BDF-LAB-REPORTS-252U1R1212)  
**Live Link**: [https://bdf-lab-03-rest-api.onrender.com](https://bdf-lab-03-rest-api.onrender.com)

---

## 1. Project Overview & Objectives

The primary objective of Lab 3 is to advance the basic CRUD routes from Lab 2 into an enterprise-ready, standards-compliant RESTful API with search, sorting, filtering, request validation, deterministic status codes, and practical debugging skills:

1. **REST Resource Modeling**: Standardize endpoints using plural nouns (`/books`) paired with standard HTTP methods (`GET`, `POST`, `PUT`, `DELETE`).
2. **Query Parameters Engine (`GET /books/`)**:
   - `search_q`: Partial title search via SQL `LIKE ?` with parameterized wildcards.
   - `min_price` & `max_price`: Range filter implemented using SQL `BETWEEN ? AND ?` or dynamic comparison clauses.
   - `order_by`: Dynamic column sorting whitelisted against `['id', 'title', 'author', 'price', 'pages']` to completely prevent SQL injection.
   - `order`: Sort direction whitelisted to `ASC` or `DESC` (default: `ASC`).
   - `limit` & `offset`: Sanitized pagination window (default: `limit=10`, `offset=0`).
3. **Input Validation**: Reject payloads missing `title` or `author`, or providing non-numeric or negative `price` values with HTTP `400 Bad Request`.
4. **Deterministic HTTP Status Codes**:
   - `201 Created` for resource additions.
   - `200 OK` for successful fetches, updates, and removals.
   - `400 Bad Request` for schema/type validation failures.
   - `404 Not Found` when a requested entity ID does not exist in the database.
5. **Uniform Response Structure**: Consistent JSON response contracts across all errors and operations (`{ "message": "..." }`).
6. **Faculty Debugging Exercise**: Diagnose, reproduce, and resolve the four defects:
   - Port conflict (`EADDRINUSE`)
   - Wrong module import path (`MODULE_NOT_FOUND`)
   - Table-name typo (`SQLITE_ERROR: no such table`)
   - Missing `await` on database asynchronous calls

---

## 2. Database Schema & Seed Data

The database is powered by SQLite and stored at [`books.db`](books.db).

### SQL DDL Schema Definition
```sql
CREATE TABLE IF NOT EXISTS book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    price INTEGER NOT NULL,
    pages INTEGER NOT NULL
);
```

### Seed Catalog (12 Technical Books)
| ID | Title | Author | Price (₹) | Pages |
| :-: | :--- | :--- | :-: | :-: |
| 1 | Clean Code | Robert C. Martin | 650 | 464 |
| 2 | The Pragmatic Programmer | Andrew Hunt & David Thomas | 720 | 352 |
| 3 | JavaScript: The Good Parts | Douglas Crockford | 450 | 176 |
| 4 | You Don't Know JS: Scope & Closures | Kyle Simpson | 550 | 278 |
| 5 | Design Patterns: Elements of Reusable Object-Oriented Software | Erich Gamma et al. | 890 | 395 |
| 6 | Refactoring: Improving the Design of Existing Code | Martin Fowler | 780 | 448 |
| 7 | Designing Data-Intensive Applications | Martin Kleppmann | 950 | 616 |
| 8 | Introduction to Algorithms (CLRS) | Thomas H. Cormen | 1250 | 1312 |
| 9 | Node.js Design Patterns | Mario Casciaro | 820 | 642 |
| 10 | Eloquent JavaScript | Marijn Haverbeke | 520 | 472 |
| 11 | Clean Architecture | Robert C. Martin | 690 | 352 |
| 12 | Fullstack Node.js | Nate Murray | 380 | 290 |

---

## 3. REST API Specification

### Endpoint Routing Matrix
| HTTP Verb | Path | Purpose | Query Parameters / Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | API Root Documentation | None | `200 OK` |
| `GET` | `/books/` | List books with search, sort, filter, pagination | `search_q`, `min_price`, `max_price`, `order_by`, `order`, `limit`, `offset` | `200 OK`, `500 Internal Error` |
| `GET` | `/books/:bookId/` | Retrieve a single book | URL Path Parameter: `bookId` | `200 OK`, `404 Not Found` |
| `POST` | `/books/` | Create a new book | JSON Body: `{ title, author, price, pages }` | `201 Created`, `400 Bad Request` |
| `PUT` | `/books/:bookId/` | Update an existing book | URL Path Parameter: `bookId`<br/>JSON Body: `{ title?, author?, price?, pages? }` | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/books/:bookId/` | Delete a book | URL Path Parameter: `bookId` | `200 OK`, `404 Not Found` |

---

## 4. Query Parameters Engine & Implementation

The `GET /books/` endpoint handles multiple query filters simultaneously without string concatenation:

```javascript
app.get('/books/', async (req, res) => {
    try {
        const {
            search_q = '',
            order_by = 'id',
            order = 'ASC',
            limit = 10,
            offset = 0,
            min_price,
            max_price
        } = req.query;

        // Whitelist column names to prevent SQL injection
        const allowedOrderByColumns = ['id', 'title', 'author', 'price', 'pages'];
        const sanitizedOrderBy = allowedOrderByColumns.includes(order_by.toLowerCase())
            ? order_by.toLowerCase()
            : 'id';

        const sanitizedOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        const parsedLimit = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100));
        const parsedOffset = Math.max(0, parseInt(offset, 10) || 0);

        const whereClauses = [];
        const queryParams = [];

        // Partial title match
        if (search_q && search_q.trim() !== '') {
            whereClauses.push('title LIKE ?');
            queryParams.push(`%${search_q.trim()}%`);
        }

        // Price range filter
        const hasMinPrice = min_price !== undefined && min_price !== '' && !isNaN(Number(min_price));
        const hasMaxPrice = max_price !== undefined && max_price !== '' && !isNaN(Number(max_price));

        if (hasMinPrice && hasMaxPrice) {
            whereClauses.push('price BETWEEN ? AND ?');
            queryParams.push(Number(min_price), Number(max_price));
        } else if (hasMinPrice) {
            whereClauses.push('price >= ?');
            queryParams.push(Number(min_price));
        } else if (hasMaxPrice) {
            whereClauses.push('price <= ?');
            queryParams.push(Number(max_price));
        }

        let sql = 'SELECT * FROM book';
        if (whereClauses.length > 0) {
            sql += ` WHERE ${whereClauses.join(' AND ')}`;
        }

        sql += ` ORDER BY ${sanitizedOrderBy} ${sanitizedOrder} LIMIT ? OFFSET ?;`;
        queryParams.push(parsedLimit, parsedOffset);

        const books = await db.all(sql, queryParams);
        res.status(200).json(books);
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
```

---

## 5. Request Validation & Status Codes

Incoming `POST /books/` requests are subjected to strict validation rules:
- **Missing or Empty Title**: Returns `400 Bad Request` with:
  ```json
  { "message": "Validation Error: 'title' is required and must be a non-empty string" }
  ```
- **Missing or Empty Author**: Returns `400 Bad Request` with:
  ```json
  { "message": "Validation Error: 'author' is required and must be a non-empty string" }
  ```
- **Missing, Non-numeric, or Negative Price**: Returns `400 Bad Request` with:
  ```json
  { "message": "Validation Error: 'price' is required and must be a valid non-negative number" }
  ```
- **Successful Creation**: Returns `201 Created` with:
  ```json
  {
    "message": "Book created successfully",
    "bookId": 13
  }
  ```
- **Non-existent ID Lookups / Mutations**: Return `404 Not Found` with:
  ```json
  { "message": "Book with id 999999 not found" }
  ```

---

## 6. Faculty Debugging Exercise: 4 Common Errors

We implemented an interactive defect reproduction and verification suite in [`debugging/broken-server.js`](debugging/broken-server.js) and [`debugging/verify-fixes.js`](debugging/verify-fixes.js):

### 1. Port Conflict (`EADDRINUSE`)
- **Symptom**: `Error: listen EADDRINUSE: address already in use 0.0.0.0:3000`
- **Root Cause**: Two processes attempting to bind to the same network interface and TCP port.
- **Fix**: Handle the `'error'` event on the server listener to automatically migrate to `PORT + 1`, or terminate the zombie process using `netstat -ano` / `taskkill`.

### 2. Wrong Import Path (`MODULE_NOT_FOUND`)
- **Symptom**: `Error: Cannot find module './wrong_modules/sqlite-driver'`
- **Root Cause**: Typo or misconfigured directory depth in CommonJS `require()`.
- **Fix**: Point `require('sqlite')` to the installed package in `node_modules` and use `path.join(__dirname, ...)` for file paths.

### 3. Table-Name Typo (`no such table`)
- **Symptom**: `SQLITE_ERROR: no such table: books`
- **Root Cause**: The DDL script declared the table as `book` (singular), while the route executed `SELECT * FROM books;` (plural).
- **Fix**: Synchronize all SQL queries to use the exact table identifier `book`.

### 4. Missing `await` on Database Call
- **Symptom**: API returns an empty object `{}` instead of an array of records.
- **Root Cause**: `db.all()` returns a Promise. When `await` is omitted, Express calls `JSON.stringify()` on the pending Promise object, which possesses no enumerable properties and serializes as `"{}"`.
- **Fix**: Prepend `await` before all asynchronous SQLite driver calls (`await db.all(...)`, `await db.get(...)`, `await db.run(...)`).

---

## 7. How to Run & Verify

### Prerequisites
- Node.js (v18.x, v20.x, or v24.x)
- npm (Node Package Manager)

### Installation & Database Seeding
```bash
cd lab-03
npm run init:db
```

### Start Server
```bash
# Start development server with auto-reload (nodemon)
npm run dev

# Or start production server
npm start
```

### Execute Automated Test Suite (41 Assertions)
```bash
npm run test:api
```

### Execute Debugging Verification
```bash
npm run debug:verify
```

### Postman Test Suite
Import [`postman_collection.json`](postman_collection.json) and [`postman_environment.json`](postman_environment.json) directly into Postman to execute the test suite covering both success and failure cases.

---

## 8. Viva Voce Questions & Answers

### Q1: Query parameter vs Path parameter?
| Aspect | Path Parameter (`req.params`) | Query Parameter (`req.query`) |
| :--- | :--- | :--- |
| **Location & Syntax** | Embedded directly in the URI path hierarchy: `/books/:bookId` (e.g. `/books/5`) | Appended to the URI after a question mark: `/books?key=value` (e.g. `/books?order_by=price`) |
| **Semantic Role** | Identifies a **specific resource** or entity instance in the system. | Used to **filter, sort, search, or paginate** a representation of a collection. |
| **Cardinality** | Typically mandatory to locate the specific entity. | Typically optional; the server applies default fallbacks when omitted. |
| **REST Analogy** | Like selecting a specific chapter in a book. | Like highlighting or searching for words across the pages. |
| **Example** | `GET /books/42/` -> Retrieves book with primary key 42. | `GET /books/?min_price=500&limit=5` -> Filters books above ₹500. |

---

### Q2: What does stateless mean?
In REST architectural design, **statelessness** means that **each incoming HTTP request from a client must contain all the information necessary for the server to understand and process the request**.
- **No Server-Side Session State**: The server does not store client context or session state across multiple requests (e.g., in memory or sticky sessions).
- **Client Ownership**: The client is responsible for holding application state (e.g., current page number, authentication tokens, filter parameters).
- **Benefits**:
  1. **Horizontal Scalability**: Any server node in a clustered or load-balanced infrastructure can process any incoming request without needing synchronized session stores.
  2. **Reliability & Fault Tolerance**: If a server crashes and restarts, pending client workflows are not lost because each request is self-contained.
  3. **Simplified Caching**: Responses can be safely cached by CDNs and reverse proxies because requests do not depend on implicit previous steps.

---

### Q3: Which status code for bad input vs a missing record?
- **Bad Input $\rightarrow$ `400 Bad Request`**:
  - Used when the client sends a request whose payload, syntax, or parameters violate server validation rules.
  - Examples: Omitting a required field (`title`), supplying a string for a numeric field (`price: "abc"`), negative numbers, or invalid JSON syntax.
  - The server understands *what* is being asked, but *refuses* to process it due to client-side input errors.
- **Missing Record $\rightarrow$ `404 Not Found`**:
  - Used when the client requests a valid URI pointing to a specific resource identifier that does not exist in the database or server catalog.
  - Example: `GET /books/99999/` or `DELETE /books/99999/` when ID 99999 is absent.
  - The request syntax and headers may be completely valid, but the target entity cannot be located.

---

## 9. Deliverables Summary

- [x] Complete REST API implementation ([`server.js`](server.js))
- [x] SQLite database initialization with 12 seed records ([`init-db.js`](init-db.js))
- [x] Query parameters engine (`search_q`, `min_price`, `max_price`, `order_by`, `order`, `limit`, `offset`)
- [x] Body validation rejecting invalid input with `400 Bad Request`
- [x] Correct status codes: `201`, `200`, `400`, `404`
- [x] Uniform `{ "message": "..." }` response contract
- [x] Parameterized SQL queries preventing SQL injection
- [x] Standalone debugging suite ([`debugging/`](debugging/)) resolving the 4 faculty defects
- [x] 41-assertion automated test runner ([`test-api.js`](test-api.js))
- [x] Postman Collection & Environment ([`postman_collection.json`](postman_collection.json))
- [x] Comprehensive report and Viva Q&A ([`README.md`](README.md))

