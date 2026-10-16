/**
 * Writes the API contract without starting the server or touching the
 * database (Nest "preview" mode skips provider instantiation):
 *
 *   docs/openapi.json                    OpenAPI 3 spec (also served at /api/docs-json)
 *   docs/taskflow.postman_collection.json Postman v2.1 collection generated from it
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { type OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { API_PREFIX, buildOpenApiDocument } from '../src/app.setup';

type Schema = {
  $ref?: string;
  type?: string;
  format?: string;
  enum?: unknown[];
  example?: unknown;
  default?: unknown;
  items?: Schema;
  properties?: Record<string, Schema>;
  required?: string[];
  allOf?: Schema[];
};

/** Builds an example JSON body from a schema (examples > defaults > type placeholders). */
function exampleFor(schema: Schema | undefined, doc: OpenAPIObject, depth = 0): unknown {
  if (!schema || depth > 4) return undefined;
  if (schema.$ref) {
    const name = schema.$ref.split('/').pop()!;
    return exampleFor(doc.components?.schemas?.[name] as Schema, doc, depth + 1);
  }
  if (schema.allOf?.length) return exampleFor(schema.allOf[0], doc, depth + 1);
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.enum?.length) return schema.enum[0];
  if (schema.type === 'object' || schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([k, v]) => [k, exampleFor(v, doc, depth + 1)]),
    );
  }
  if (schema.type === 'array') return [exampleFor(schema.items, doc, depth + 1)];
  if (schema.format === 'uuid') return '{{projectId}}';
  if (schema.type === 'number' || schema.type === 'integer') return 1;
  if (schema.type === 'boolean') return true;
  return 'string';
}

function toPostman(doc: OpenAPIObject) {
  const folders = new Map<string, unknown[]>();

  for (const [path, item] of Object.entries(doc.paths)) {
    for (const [method, op] of Object.entries(item as Record<string, Record<string, unknown>>)) {
      const tag = ((op.tags as string[]) ?? ['Other'])[0];
      const segments = path
        .replace(/^\//, '')
        .split('/')
        .map((s) => (s === '{id}' ? (path.startsWith('/api/tasks') ? '{{taskId}}' : '{{projectId}}') : s));
      const query = ((op.parameters as { in: string; name: string; schema?: Schema }[]) ?? [])
        .filter((p) => p.in === 'query')
        .map((p) => ({ key: p.name, value: String(exampleFor(p.schema, doc) ?? ''), disabled: true }));

      const bodySchema = (op.requestBody as { content?: Record<string, { schema: Schema }> } | undefined)?.content?.[
        'application/json'
      ]?.schema;
      const body = bodySchema
        ? { mode: 'raw', raw: JSON.stringify(exampleFor(bodySchema, doc), null, 2), options: { raw: { language: 'json' } } }
        : undefined;

      // Capture ids/tokens so requests can be run top-to-bottom.
      const isLogin = path.endsWith('/auth/login') || path.endsWith('/auth/register');
      const captures: string[] = [];
      if (isLogin) captures.push("pm.collectionVariables.set('accessToken', pm.response.json().accessToken);");
      if (method === 'post' && path === '/api/projects') captures.push("pm.collectionVariables.set('projectId', pm.response.json().id);");
      if (method === 'post' && path === '/api/tasks') captures.push("pm.collectionVariables.set('taskId', pm.response.json().id);");

      const request = {
        name: (op.summary as string) ?? `${method.toUpperCase()} ${path}`,
        request: {
          method: method.toUpperCase(),
          header: [{ key: 'Content-Type', value: 'application/json' }, { key: 'X-Timezone', value: 'Asia/Kolkata', disabled: true }],
          url: { raw: `{{baseUrl}}/${segments.join('/')}`, host: ['{{baseUrl}}'], path: segments, query },
          ...(body && { body }),
          ...((path.startsWith('/api/auth') && !path.endsWith('/me')) || path === '/api/health' ? { auth: { type: 'noauth' } } : {}),
        },
        // Every request asserts success, so `newman run` doubles as a full-stack smoke test in CI.
        event: [
          {
            listen: 'test',
            script: {
              type: 'text/javascript',
              exec: [
                "pm.test('responds successfully', () => pm.expect(pm.response.code).to.be.below(300));",
                ...(captures.length ? ['if (pm.response.code < 300) {', ...captures.map((c) => `  ${c}`), '}'] : []),
              ],
            },
          },
        ],
      };
      folders.set(tag, [...(folders.get(tag) ?? []), request]);
    }
  }

  return {
    info: {
      name: 'TaskFlow API',
      description:
        'Generated from docs/openapi.json. Run "Log in with email and password" first (the demo account is pre-filled); ' +
        'it stores the access token for Bearer auth. Creating a project/task stores its id for the requests that follow.',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] },
    variable: [
      { key: 'baseUrl', value: 'http://localhost:4000' },
      { key: 'accessToken', value: '' },
      { key: 'projectId', value: '' },
      { key: 'taskId', value: '' },
    ],
    item: orderForRunner(folders),
  };
}

type PmItem = { name: string; request: { method: string; url: { raw: string } } };

/**
 * Order folders so the collection can be run top-to-bottom (Postman runner /
 * newman): log in, create, read, update, then delete and log out last.
 */
function orderForRunner(folders: Map<string, unknown[]>) {
  const order = ['Health', 'Auth', 'Projects', 'Tasks', 'Dashboard'];
  const cleanup: PmItem[] = [];
  const result = order
    .filter((name) => folders.has(name))
    .map((name) => {
      const items = folders.get(name) as PmItem[];
      const keep = items.filter((i) => {
        const last = i.request.method === 'DELETE' || i.request.url.raw.endsWith('/auth/logout');
        if (last) cleanup.push(i);
        return !last;
      });
      return { name, item: keep };
    });
  // Delete the task before its project, and log out at the very end.
  const rank = (i: PmItem) => (i.request.url.raw.includes('/tasks/') ? 0 : i.request.url.raw.includes('/projects/') ? 1 : 2);
  result.push({ name: 'Cleanup', item: cleanup.sort((a, b) => rank(a) - rank(b)) });
  return result;
}

async function main() {
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  app.setGlobalPrefix(API_PREFIX);
  const doc = buildOpenApiDocument(app);
  doc.servers = [{ url: 'http://localhost:4000', description: 'Local' }];

  const docsDir = join(__dirname, '..', '..', 'docs');
  writeFileSync(join(docsDir, 'openapi.json'), JSON.stringify(doc, null, 2) + '\n');

  const collection = toPostman(doc);
  // Pre-fill the demo credentials on the login request.
  const auth = collection.item.find((f) => f.name === 'Auth');
  const login = (auth?.item as { name: string; request: { body?: { raw: string } } }[] | undefined)?.find((r) =>
    r.name.startsWith('Log in'),
  );
  if (login?.request.body) login.request.body.raw = JSON.stringify({ email: 'demo@taskflow.dev', password: 'Password123!' }, null, 2);
  // A random email keeps "register" repeatable (a fixed one would be 409 on the second run).
  const register = (auth?.item as { name: string; request: { body?: { raw: string } } }[] | undefined)?.find((r) =>
    r.name.startsWith('Create an account'),
  );
  if (register?.request.body) {
    register.request.body.raw = JSON.stringify({ name: 'Postman Tester', email: '{{$randomEmail}}', password: 'Password123!' }, null, 2);
  }
  writeFileSync(join(docsDir, 'taskflow.postman_collection.json'), JSON.stringify(collection, null, 2) + '\n');

  console.log(`Wrote docs/openapi.json (${Object.keys(doc.paths).length} paths) and docs/taskflow.postman_collection.json`);
  await app.close();
}

void main();
