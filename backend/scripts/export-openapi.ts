/**
 * Writes the OpenAPI spec to ../docs/openapi.json without starting the server
 * or connecting to the database (preview mode skips provider instantiation).
 * The file can be imported directly into Postman / Insomnia.
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { API_PREFIX, buildOpenApiDocument } from '../src/app.setup';

async function main() {
  const app = await NestFactory.create(AppModule, { preview: true, logger: false });
  app.setGlobalPrefix(API_PREFIX);
  const doc = buildOpenApiDocument(app);
  doc.servers = [{ url: 'http://localhost:4000', description: 'Local' }];
  const out = join(__dirname, '..', '..', 'docs', 'openapi.json');
  writeFileSync(out, JSON.stringify(doc, null, 2) + '\n');
  console.log(`OpenAPI spec written to ${out} (${Object.keys(doc.paths).length} paths)`);
  await app.close();
}

void main();
