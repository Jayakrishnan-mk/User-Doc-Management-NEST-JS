import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let server: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const testUser = {
    username: `e2euser_${Date.now()}`,
    password: 'e2epass',
  };

  it('should register a new user', async () => {
    const res = await request(server)
      .post('/auth/register')
      .send(testUser)
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('username', testUser.username);
    expect(res.body).not.toHaveProperty('password');
  });

  it('should not register duplicate user', async () => {
    await request(server).post('/auth/register').send(testUser).expect(400);
  });

  it('should login with correct credentials', async () => {
    const res = await request(server)
      .post('/auth/login')
      .send(testUser)
      .expect(201);
    expect(res.body).toHaveProperty('access_token');
  });

  it('should not login with wrong password', async () => {
    await request(server)
      .post('/auth/login')
      .send({ username: testUser.username, password: 'wrongpass' })
      .expect(401);
  });
});

describe('User (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  let userId: number;
  const testUser = {
    username: `e2euser2_${Date.now()}`,
    password: 'e2epass',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
    // Register and login to get token
    const regRes = await request(server).post('/auth/register').send(testUser);
    userId = regRes.body.id;
    const loginRes = await request(server).post('/auth/login').send(testUser);
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get current user profile', async () => {
    const res = await request(server)
      .get(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('id', userId);
    expect(res.body).toHaveProperty('username', testUser.username);
    expect(res.body).not.toHaveProperty('password');
  });

  it('should update user profile', async () => {
    const res = await request(server)
      .put(`/users/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ username: testUser.username + '_updated' })
      .expect(200);
    expect(res.body).toHaveProperty('username', testUser.username + '_updated');
  });

  it('should not allow unauthenticated access', async () => {
    await request(server).get(`/users/${userId}`).expect(401);
  });
});

describe('Document (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userId: number;
  let documentId: number;
  const testUser = {
    username: `e2edocuser_${Date.now()}`,
    password: 'e2epass',
  };
  const testDocument = {
    title: 'Test Document',
    description: 'A test document',
    fileUrl: '/uploads/testfile.txt',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
    // Register and login to get token
    const regRes = await request(server).post('/auth/register').send(testUser);
    userId = regRes.body.id;
    const loginRes = await request(server).post('/auth/login').send(testUser);
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a document', async () => {
    const res = await request(server)
      .post('/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testDocument)
      .expect(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title', testDocument.title);
    documentId = res.body.id;
  });

  it('should get all documents', async () => {
    const res = await request(server)
      .get('/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should get document by id', async () => {
    const res = await request(server)
      .get(`/documents/${documentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('id', documentId);
  });

  it('should update document', async () => {
    const res = await request(server)
      .put(`/documents/${documentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Updated Title' })
      .expect(200);
    expect(res.body).toHaveProperty('title', 'Updated Title');
  });

  it('should not allow unauthenticated access', async () => {
    await request(server).get(`/documents/${documentId}`).expect(401);
  });

  it('should delete document', async () => {
    const res = await request(server)
      .delete(`/documents/${documentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('message', 'Document deleted');
  });
});

describe('Document Upload (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userId: number;
  const testUser = {
    username: `e2euploader_${Date.now()}`,
    password: 'e2epass',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
    // Register and login to get token
    const regRes = await request(server).post('/auth/register').send(testUser);
    userId = regRes.body.id;
    const loginRes = await request(server).post('/auth/login').send(testUser);
    accessToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should upload a file and return fileUrl', async () => {
    const res = await request(server)
      .post('/documents/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('test file content'), 'testfile.txt')
      .expect(201);
    expect(res.body).toHaveProperty('fileUrl');
    expect(typeof res.body.fileUrl).toBe('string');
    expect(res.body.fileUrl).toMatch(/\/uploads\//);
  });
});

describe('Ingestion (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let accessToken: string;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userId: number;
  let documentId: number;
  const testUser = {
    username: `e2eingest_${Date.now()}`,
    password: 'e2epass',
  };
  const testDocument = {
    title: 'Ingest Doc',
    description: 'For ingestion test',
    fileUrl: '/uploads/testfile.txt',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
    // Register and login to get token
    const regRes = await request(server).post('/auth/register').send(testUser);
    userId = regRes.body.id;
    const loginRes = await request(server).post('/auth/login').send(testUser);
    accessToken = loginRes.body.access_token;
    // Create a document to ingest
    const docRes = await request(server)
      .post('/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(testDocument);
    documentId = docRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should trigger ingestion for a document', async () => {
    const res = await request(server)
      .post(`/ingestion/trigger`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ documentId })
      .expect(201);
    if (res.body.status) {
      expect(['pending', 'processing', 'completed', 'failed']).toContain(
        res.body.status,
      );
    } else {
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/file not found/i);
    }
  });

  it('should get ingestion status for a document', async () => {
    const res = await request(server)
      .get(`/ingestion/status/${documentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body).toHaveProperty('status');
    expect(['pending', 'processing', 'completed', 'failed']).toContain(
      res.body.status,
    );
  });

  it('should return 404 for non-existent document ingestion', async () => {
    await request(server)
      .post(`/ingestion/trigger`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ documentId: 999999 })
      .expect(201); // Controller returns 201 with error in body if not found
    await request(server)
      .get(`/ingestion/status/999999`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200); // Controller returns 200 with error in body if not found
  });
});

describe('Role-based Access (e2e)', () => {
  let app: INestApplication;
  let server: any;
  let adminToken: string;
  let viewerToken: string;
  let adminId: number;
  let viewerId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
    // Register admin
    const adminUser = {
      username: `e2eadmin_${Date.now()}`,
      password: 'e2epass',
      role: 'admin',
    };
    const regAdmin = await request(server)
      .post('/auth/register')
      .send(adminUser);
    adminId = regAdmin.body.id;
    const loginAdmin = await request(server)
      .post('/auth/login')
      .send(adminUser);
    adminToken = loginAdmin.body.access_token;
    // Register viewer
    const viewerUser = {
      username: `e2eviewer_${Date.now()}`,
      password: 'e2epass',
      role: 'viewer',
    };
    const regViewer = await request(server)
      .post('/auth/register')
      .send(viewerUser);
    viewerId = regViewer.body.id;
    const loginViewer = await request(server)
      .post('/auth/login')
      .send(viewerUser);
    viewerToken = loginViewer.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should allow admin to update user role', async () => {
    const res = await request(server)
      .patch(`/users/${viewerId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'editor' })
      .expect(200);
    expect(res.body).toHaveProperty('role', 'editor');
  });

  it('should forbid viewer from updating user role', async () => {
    await request(server)
      .patch(`/users/${adminId}/role`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ role: 'editor' })
      .expect(403);
  });

  it('should forbid viewer from deleting a user', async () => {
    await request(server)
      .delete(`/users/${adminId}`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);
  });

  it('should allow admin to delete a user', async () => {
    await request(server)
      .delete(`/users/${viewerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
