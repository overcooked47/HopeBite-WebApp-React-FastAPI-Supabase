# HopeBite Backend

A FastAPI backend for the HopeBite food donation platform.

## 🎉 Latest Update (January 24, 2026)

**All 12 reported issues have been fixed!** 

See the comprehensive documentation:
- **QUICK_START.md** - Start here! (3 min read)
- **COMPLETE_FIXES_REPORT.md** - Detailed explanation of all fixes (30 min read)
- **FRONTEND_INTEGRATION_GUIDE.md** - For frontend developers (10 min read)
- **IMPLEMENTATION_SUMMARY.md** - Executive summary (5 min read)

## Features

- User authentication (JWT-based)
- Food donation management
- Food request/claim system
- Zakat calculator
- Leaderboard system (now dynamic!)
- Real-time notifications
- **NEW**: Comprehensive profile history endpoints
- **NEW**: Dynamic recipient selection for zakat
- **NEW**: Role-based access control

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. **NEW**: Clean test data (first time only):
```bash
python -m scripts/cleanup_test_data
```

6. Start the server:
```bash
uvicorn app.main:app --reload
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## New API Endpoints

```
GET  /api/v1/users/me/donation-history           - Contributor donation history
GET  /api/v1/users/me/food-request-history       - Recipient food requests  
GET  /api/v1/users/me/zakat-donation-history     - Zakat donation history
GET  /api/v1/zakat/available-recipients          - Dynamic recipient list
GET  /api/v1/notifications/                      - Get notifications
GET  /api/v1/admin/dashboard                     - Admin statistics
```

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/
│   │       └── router.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   ├── models/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── alembic/
├── tests/
├── requirements.txt
└── README.md
```
