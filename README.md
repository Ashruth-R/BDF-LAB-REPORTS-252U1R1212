# Backend Development Fundamentals – Lab Repository

**Course**: Backend Development Fundamentals (Year II Term II)  
**Student Name**: R Ashruth Rayudu  
**Registration Number**: 252U1R1212  
**Section**: Core CSE-2D  
**Faculty**: Shiva Sai Teja  
**Repository**: [Ashruth-R/BDF-LAB-REPORTS-252U1R1212](https://github.com/Ashruth-R/BDF-LAB-REPORTS-252U1R1212)  
**Live Server (Lab 01)**: [https://bdf-lab-01-express.onrender.com](https://bdf-lab-01-express.onrender.com)  
**Live Server (Lab 02)**: [https://bdf-lab-02-sqlite-crud.onrender.com](https://bdf-lab-02-sqlite-crud.onrender.com)
---

## Course Lab Index

This repository houses all laboratory assignments and project deliverables for Backend Development Fundamentals, organized with one folder per lab (`lab-01` through `lab-10`):

| Lab Number | Lab Title | Status | Documentation & Code |
| :---: | :--- | :---: | :---: |
| **Lab 01** | **Node.js and Express Server** | ✅ Completed | [Browse lab-01/](lab-01/) • [🌐 Live Server](https://bdf-lab-01-express.onrender.com) |
| **Lab 02** | **SQLite Database and CRUD Routes** | ✅ Completed | [Browse lab-02/](lab-02/) • [🌐 Live Server](https://bdf-lab-02-sqlite-crud.onrender.com) |
| **Lab 03** | **REST API, Query Parameters, Validation & Debugging** | ✅ Completed | [Browse lab-03/](lab-03/) • [🌐 Live Server](https://bdf-lab-03-rest-api.onrender.com) |
| **Lab 04** | *Upcoming Lab* | ⏳ Pending | `lab-04/` |
| **Lab 05** | *Upcoming Lab* | ⏳ Pending | `lab-05/` |
| **Lab 06** | *Upcoming Lab* | ⏳ Pending | `lab-06/` |
| **Lab 07** | *Upcoming Lab* | ⏳ Pending | `lab-07/` |
| **Lab 08** | *Upcoming Lab* | ⏳ Pending | `lab-08/` |
| **Lab 09** | *Upcoming Lab* | ⏳ Pending | `lab-09/` |
| **Lab 10** | *Upcoming Lab* | ⏳ Pending | `lab-10/` |

---

## Lab 1 Overview: Node.js & Express Server
- **Folder**: [`lab-01/`](lab-01/)
- **Live Server**: [https://bdf-lab-01-express.onrender.com](https://bdf-lab-01-express.onrender.com)
- **Documentation**: [`lab-01/README.md`](lab-01/README.md)

---

## Lab 2 Overview: SQLite Database & CRUD Routes
- **Folder**: [`lab-02/`](lab-02/)
- **Live Server**: [https://bdf-lab-02-sqlite-crud.onrender.com](https://bdf-lab-02-sqlite-crud.onrender.com)
- **Documentation**: [`lab-02/README.md`](lab-02/README.md)
- **Deliverables**:
  - SQLite database file `books.db` seeded with 10 records ([`init-db.js`](lab-02/init-db.js))
  - Express server with async `initializeDBAndServer()` ([`server.js`](lab-02/server.js))
  - 5 Parameterized CRUD endpoints: `GET /books/`, `GET /books/:bookId/`, `POST /books/`, `PUT /books/:bookId/`, `DELETE /books/:bookId/`
  - Automated test runner verifying status codes and database mutations ([`test-crud.js`](lab-02/test-crud.js))
  - Visual proof screenshots ([`screenshots/`](lab-02/screenshots/))
  - Full lab report and Viva Q&A ([`lab-02/README.md`](lab-02/README.md))

### Quick Start (Lab 2)
```bash
git clone https://github.com/Ashruth-R/BDF-LAB-REPORTS-252U1R1212.git
cd BDF-LAB-REPORTS-252U1R1212/lab-02
npm install
npm run init:db
npm start
```

---

## Lab 3 Overview: REST API, Query Parameters, Validation & Debugging
- **Folder**: [`lab-03/`](lab-03/)
- **Live Server**: [https://bdf-lab-03-rest-api.onrender.com](https://bdf-lab-03-rest-api.onrender.com)
- **Documentation**: [`lab-03/README.md`](lab-03/README.md)
- **Deliverables**:
  - Express REST API with noun endpoints and status codes (`201`, `200`, `400`, `404`) ([`server.js`](lab-03/server.js))
  - Advanced Query Parameters: `search_q`, `min_price`, `max_price`, `order_by`, `order`, `limit`, `offset`
  - Body validation rejecting missing fields / invalid prices with `400 Bad Request` and uniform `{ "message": "..." }`
  - Faculty Debugging Exercise: Reproduces and solves `EADDRINUSE`, `MODULE_NOT_FOUND`, `no such table`, and missing `await` ([`debugging/`](lab-03/debugging/))
  - 41-assertion automated test runner ([`test-api.js`](lab-03/test-api.js))
  - Postman Collection v2.1.0 and Environment ([`postman_collection.json`](lab-03/postman_collection.json))
  - Full lab report and Viva Q&A ([`lab-03/README.md`](lab-03/README.md))

### Quick Start (Lab 3)
```bash
git clone https://github.com/Ashruth-R/BDF-LAB-REPORTS-252U1R1212.git
cd BDF-LAB-REPORTS-252U1R1212/lab-03
npm run init:db
npm start
npm run test:api
npm run debug:verify
```


