# Portfolio Site — Backend

Express + MongoDB API powering the personal portfolio site. Serves blog and project content, handles admin authentication, and proxies image uploads to Cloudinary.

## Tech Stack

- **Runtime**: Node.js (ES modules)
- **Framework**: Express 5
- **Database**: MongoDB via Mongoose
- **Auth**: JWT (Bearer tokens) + bcrypt
- **Uploads**: Multer + `multer-storage-cloudinary` → Cloudinary
- **Other**: `slugify` for blog slugs, `dotenv` for config, `cors`

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB connection string
- Cloudinary account

### Install
```bash
npm install
```

### Environment

Create a `.env` file in this directory:

```
MONGO_URI=<your mongodb connection string>
JWT_SECRET=<random secret>
PORT=5000
CLOUDINARY_CLOUD_NAME=<cloudinary cloud name>
CLOUDINARY_API_KEY=<cloudinary api key>
CLOUDINARY_API_SECRET=<cloudinary api secret>
```

### Run
```bash
npm run dev    # nodemon (development)
npm start      # production
```

The server listens on `PORT` (default `5000`).

## Project Structure

```
backend/
├── config/
│   ├── cloudinary.js   # Multer + Cloudinary storage (folder: personal_website)
│   └── db.js           # MongoDB connection
├── controllers/
│   ├── authController.js
│   ├── blogContollers.js
│   └── projectControllers.js
├── middleware/
│   └── authMiddleware.js  # `protect` — verifies JWT, attaches req.user
├── models/
│   ├── Blog.js
│   ├── Project.js
│   └── User.js            # bcrypt pre-save hook + matchPassword()
├── routes/
│   ├── authRoutes.js
│   ├── blogRoutes.js
│   ├── projectRoutes.js
│   └── uploadRoutes.js
└── server.js              # Entry point
```

## API

All routes are mounted under `/api`. Write operations require an `Authorization: Bearer <token>` header.

### Auth — `/api/auth`
| Method | Path     | Auth | Description           |
|--------|----------|------|-----------------------|
| POST   | `/login` | —    | Admin login → JWT     |

### Blogs — `/api/blogs`
| Method | Path    | Auth | Description       |
|--------|---------|------|-------------------|
| GET    | `/`     | —    | List blogs        |
| GET    | `/:id`  | —    | Get blog by id    |
| POST   | `/`     | ✅   | Create blog       |
| PUT    | `/:id`  | ✅   | Update blog       |
| DELETE | `/:id`  | ✅   | Delete blog       |

Blog titles are auto-slugified on create; slugs are unique and lowercase.

### Projects — `/api/projects`
| Method | Path    | Auth | Description       |
|--------|---------|------|-------------------|
| GET    | `/`     | —    | List projects     |
| GET    | `/:id`  | —    | Get project by id |
| POST   | `/`     | ✅   | Create project    |
| PUT    | `/:id`  | ✅   | Update project    |
| DELETE | `/:id`  | ✅   | Delete project    |

### Uploads — `/api/upload`
| Method | Path | Auth | Description                                              |
|--------|------|------|----------------------------------------------------------|
| POST   | `/`  | ✅   | Multipart form upload (`image`) → returns Cloudinary URL |

Response shape:
```json
{ "url": "https://res.cloudinary.com/.../personal_website/..." }
```

## Data Models

- **Blog** — `title`, `slug`, `markdownContent`, `coverImageURL`, `tags[]`, `isPublished`
- **Project** — `title`, `description`, `markdownContent`, `technologies[]`, `githubLink`, `liveDemoLink`, `coverImageUrl`, `isFeatured`
- **User** — `email`, `password` (hashed), `matchPassword()`

## Notes

- JWT payload uses the field `is` (not `id`) to look up the user in `authMiddleware.js`. Token generation in `authController.js` must match.
- Image uploads are stored in the `personal_website` folder on Cloudinary; the resolved URL comes from `req.file.path`.
- The frontend dev proxy forwards `/api/*` to the deployed backend on Render.
