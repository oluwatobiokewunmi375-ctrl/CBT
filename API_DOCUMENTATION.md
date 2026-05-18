# CBT Platform - API Documentation

**Version:** 1.0.0  
**Status:** Production Ready  
**Last Updated:** May 18, 2026  
**Base URL:** `https://yourdomain.com/api`

---

## 🔐 Authentication

### JWT Authentication
All protected endpoints require a Bearer token in the Authorization header:

```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

**Token Structure:**
- Issued at: login/register
- Expires: 7 days
- Payload: `{ userId, email, role }`

---

## 📚 API Endpoints

### Authentication API

#### 1. Register User
```
POST /api/auth/register

Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "role": "STUDENT|TEACHER|ADMIN",
  "schoolCode": "DEMO"
}

Response: 201
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "STUDENT"
  }
}

Errors:
- 400: Missing required fields
- 409: Email already exists
```

#### 2. Login
```
POST /api/auth/login

Request:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Response: 200
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "STUDENT"
  }
}

Errors:
- 400: Missing email or password
- 401: Invalid credentials
- 404: User not found
```

#### 3. Get Profile
```
GET /api/auth/profile

Headers: Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "STUDENT",
    "student": {
      "id": "student-id",
      "studentNo": "STU001",
      "school": { "id": "school-id", "name": "Demo School" }
    }
  }
}

Errors:
- 401: Unauthorized
- 404: User not found
```

---

### Exam API

#### 4. Get Exam List
```
GET /api/exam/list

Headers: Authorization: Bearer {token}

Query Parameters:
- schoolId (optional)
- status: DRAFT|PUBLISHED|ENDED (optional)
- limit: 10 (default)
- offset: 0 (default)

Response: 200
{
  "success": true,
  "exams": [
    {
      "id": "exam-id",
      "title": "Mathematics Final",
      "description": "Final exam for math",
      "duration": 3600,
      "totalMarks": 100,
      "status": "PUBLISHED"
    }
  ],
  "total": 10,
  "limit": 10,
  "offset": 0
}

Errors:
- 401: Unauthorized
- 404: No exams found
```

#### 5. Get Exam Details
```
GET /api/exam/{id}

Headers: Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "exam": {
    "id": "exam-id",
    "title": "Mathematics Final",
    "duration": 3600,
    "totalMarks": 100,
    "questions": [
      {
        "id": "question-id",
        "content": "What is 2+2?",
        "type": "MULTIPLE_CHOICE",
        "marks": 1,
        "options": [
          { "id": "opt1", "text": "3" },
          { "id": "opt2", "text": "4" },
          { "id": "opt3", "text": "5" }
        ]
      }
    ]
  }
}

Errors:
- 401: Unauthorized
- 404: Exam not found
```

#### 6. Start Exam Session
```
POST /api/exam/start

Headers: Authorization: Bearer {token}

Request:
{
  "examId": "exam-id",
  "ipAddress": "192.168.1.1",
  "deviceInfo": "Mozilla/5.0..."
}

Response: 201
{
  "success": true,
  "session": {
    "id": "session-id",
    "examId": "exam-id",
    "userId": "user-id",
    "startedAt": "2026-05-18T10:00:00Z",
    "duration": 3600
  }
}

Errors:
- 400: Invalid exam ID
- 401: Unauthorized
- 409: Session already active
```

#### 7. Save Exam Progress
```
POST /api/exam/save-progress

Headers: Authorization: Bearer {token}

Request:
{
  "sessionId": "session-id",
  "currentQuestionId": "question-id",
  "answers": {
    "question-id-1": "option-id-1",
    "question-id-2": "option-id-2"
  }
}

Response: 200
{
  "success": true,
  "message": "Progress saved"
}

Errors:
- 400: Invalid session ID
- 401: Unauthorized
- 500: Save failed
```

#### 8. Submit Exam
```
POST /api/exam/submit

Headers: Authorization: Bearer {token}

Request:
{
  "sessionId": "session-id",
  "answers": {
    "question-id-1": "option-id-1",
    "question-id-2": "option-id-2"
  },
  "timeSpent": 1800
}

Response: 200
{
  "success": true,
  "submission": {
    "id": "submission-id",
    "score": 80,
    "totalMarks": 100,
    "percentage": 80,
    "status": "SUBMITTED"
  }
}

Errors:
- 400: Missing required fields
- 401: Unauthorized
- 404: Session not found
- 409: Already submitted
```

---

### Admin API

#### 9. Get Admin Dashboard
```
GET /api/admin/dashboard

Headers: Authorization: Bearer {token} (ADMIN role required)

Response: 200
{
  "success": true,
  "dashboard": {
    "totalStudents": 150,
    "totalExams": 25,
    "totalResults": 500,
    "averageScore": 72.5,
    "activeUsers": 45,
    "recentExams": [...]
  }
}

Errors:
- 401: Unauthorized
- 403: Insufficient permissions
```

#### 10. Create Exam
```
POST /api/admin/exams

Headers: Authorization: Bearer {token} (TEACHER/ADMIN role required)

Request:
{
  "title": "Mathematics Final",
  "description": "End of semester exam",
  "duration": 3600,
  "totalMarks": 100,
  "subjectId": "subject-id",
  "questions": [
    {
      "content": "What is 2+2?",
      "type": "MULTIPLE_CHOICE",
      "marks": 1,
      "options": ["3", "4", "5", "6"],
      "correctAnswer": "3"
    }
  ]
}

Response: 201
{
  "success": true,
  "exam": {
    "id": "exam-id",
    "title": "Mathematics Final",
    "status": "DRAFT"
  }
}

Errors:
- 400: Invalid data
- 401: Unauthorized
- 403: Insufficient permissions
```

#### 11. Update Exam
```
PUT /api/admin/exams/{id}

Headers: Authorization: Bearer {token} (TEACHER/ADMIN role required)

Request:
{
  "title": "Mathematics Final - Updated",
  "description": "Updated description",
  "duration": 7200
}

Response: 200
{
  "success": true,
  "exam": {...}
}

Errors:
- 400: Invalid data
- 401: Unauthorized
- 404: Exam not found
```

#### 12. Delete Exam
```
DELETE /api/admin/exams/{id}

Headers: Authorization: Bearer {token} (ADMIN role required)

Response: 200
{
  "success": true,
  "message": "Exam deleted"
}

Errors:
- 401: Unauthorized
- 403: Insufficient permissions
- 404: Exam not found
```

---

### Results API

#### 13. Get Student Results
```
GET /api/results/list

Headers: Authorization: Bearer {token}

Query Parameters:
- studentId (optional, for admins)
- limit: 10 (default)
- offset: 0 (default)

Response: 200
{
  "success": true,
  "results": [
    {
      "id": "result-id",
      "examTitle": "Mathematics Final",
      "score": 80,
      "totalMarks": 100,
      "percentage": 80,
      "status": "PASSED",
      "submittedAt": "2026-05-18T11:00:00Z"
    }
  ],
  "total": 5
}

Errors:
- 401: Unauthorized
- 404: No results found
```

#### 14. Get Result Details
```
GET /api/results/{id}

Headers: Authorization: Bearer {token}

Response: 200
{
  "success": true,
  "result": {
    "id": "result-id",
    "exam": { "id": "exam-id", "title": "Math Final" },
    "student": { "id": "student-id", "name": "John Doe" },
    "answers": [
      {
        "questionId": "q1",
        "studentAnswer": "4",
        "correctAnswer": "4",
        "isCorrect": true,
        "marks": 1
      }
    ],
    "totalScore": 80,
    "totalMarks": 100,
    "percentage": 80
  }
}

Errors:
- 401: Unauthorized
- 404: Result not found
```

#### 15. Export Results
```
GET /api/results/export

Headers: Authorization: Bearer {token}

Query Parameters:
- format: csv|pdf|excel (default: csv)
- examId (optional)
- startDate (optional, ISO 8601)
- endDate (optional, ISO 8601)

Response: 200 (Binary file download)

Errors:
- 400: Invalid format
- 401: Unauthorized
- 404: No data to export
```

---

### School API

#### 16. Get Schools
```
GET /api/school

Headers: Authorization: Bearer {token} (SUPER_ADMIN role required)

Query Parameters:
- limit: 10 (default)
- offset: 0 (default)

Response: 200
{
  "success": true,
  "schools": [
    {
      "id": "school-id",
      "name": "Demo School",
      "shortCode": "DEMO",
      "principal": "Dr. John Smith",
      "address": "123 Education Lane"
    }
  ]
}

Errors:
- 401: Unauthorized
- 403: Insufficient permissions
```

#### 17. Create School
```
POST /api/school/create

Headers: Authorization: Bearer {token} (SUPER_ADMIN role required)

Request:
{
  "name": "New School",
  "shortCode": "NS001",
  "principal": "Dr. Jane Doe",
  "address": "456 Learning Road",
  "motto": "Excellence in Education"
}

Response: 201
{
  "success": true,
  "school": {
    "id": "school-id",
    "name": "New School",
    "shortCode": "NS001"
  }
}

Errors:
- 400: Invalid data
- 401: Unauthorized
- 403: Insufficient permissions
- 409: School already exists
```

---

### Analytics API

#### 18. Get Exam Analytics
```
GET /api/analytics/exam/{examId}

Headers: Authorization: Bearer {token} (TEACHER/ADMIN role required)

Response: 200
{
  "success": true,
  "analytics": {
    "examId": "exam-id",
    "totalSubmissions": 50,
    "averageScore": 72.5,
    "medianScore": 75,
    "minScore": 45,
    "maxScore": 98,
    "passPercentage": 80,
    "scoreDistribution": {
      "0-20": 2,
      "20-40": 5,
      "40-60": 10,
      "60-80": 20,
      "80-100": 13
    }
  }
}

Errors:
- 401: Unauthorized
- 403: Insufficient permissions
- 404: Exam not found
```

---

### Health Check API

#### 19. Health Check
```
GET /api/health

Response: 200
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-05-18T12:00:00Z",
  "database": "connected",
  "uptime": 3600
}

No authentication required
```

---

## 🔄 Common Response Patterns

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "errorCode": "ERROR_CODE",
  "timestamp": "2026-05-18T12:00:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## ⚠️ Error Codes

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Request data validation failed |
| AUTH_ERROR | 401 | Authentication failed |
| FORBIDDEN | 403 | User lacks required permissions |
| NOT_FOUND | 404 | Requested resource not found |
| CONFLICT | 409 | Resource conflict (e.g., duplicate) |
| RATE_LIMIT | 429 | Too many requests |
| SERVER_ERROR | 500 | Internal server error |

---

## 🔐 Role-Based Access Control

| Endpoint | STUDENT | TEACHER | ADMIN | SUPER_ADMIN |
|----------|---------|---------|-------|------------|
| POST /register | ✓ | ✓ | ✓ | ✓ |
| GET /profile | ✓ | ✓ | ✓ | ✓ |
| GET /exam/list | ✓ | ✓ | ✓ | ✓ |
| POST /exam/start | ✓ | - | - | - |
| POST /admin/exams | - | ✓ | ✓ | ✓ |
| GET /admin/dashboard | - | ✓ | ✓ | ✓ |
| GET /api/school | - | - | - | ✓ |
| POST /school/create | - | - | - | ✓ |

---

## 📝 Example API Calls

### Using cURL
```bash
# Register
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "fullName": "John Doe",
    "role": "STUDENT",
    "schoolCode": "DEMO"
  }'

# Login
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'

# Get profile
curl -X GET https://yourdomain.com/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using JavaScript/Fetch
```javascript
// Login
const response = await fetch('https://yourdomain.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePassword123'
  })
});

const { token } = await response.json();

// Get exams
const examsResponse = await fetch('https://yourdomain.com/api/exam/list', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { exams } = await examsResponse.json();
```

---

## 🚀 Rate Limiting

- **Default Limit:** 100 requests per 15 minutes per IP
- **Auth Endpoints:** 10 requests per 15 minutes
- **Admin Endpoints:** 50 requests per 15 minutes

When limit is exceeded, you'll receive:
```
HTTP 429 Too Many Requests
{
  "error": "Too many requests",
  "retry_after": 60
}
```

---

## 🔗 Webhooks (Future)

Webhook support will be added for:
- Exam completion
- Result submission
- Payment processing
- User registration

---

## 📞 Support

**API Issues:** api-support@yourdomain.com  
**Documentation:** https://docs.yourdomain.com/api  
**Status Page:** https://status.yourdomain.com

---

**Version:** 1.0.0 | **Last Updated:** May 18, 2026 | **Status:** Production Ready
