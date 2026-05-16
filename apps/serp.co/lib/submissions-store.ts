import { promises as fs } from 'node:fs'
import path from 'node:path'
import {
  PendingSubmissionSchema,
  type PendingSubmission,
  type VerifiedSubmission,
  VerifiedSubmissionSchema,
} from '@thedaviddias/site-contract/submission-schema'
import { resolveFromRoot } from './server-utils'

const DATA_DIR = resolveFromRoot('data')

function dataFilePath(type: 'pending' | 'verified'): string {
  return path.join(DATA_DIR, `submissions-${type}.json`)
}

export async function readSubmissions(
  type: 'pending'
): Promise<PendingSubmission[]>
export async function readSubmissions(
  type: 'verified'
): Promise<VerifiedSubmission[]>
export async function readSubmissions(
  type: 'pending' | 'verified'
): Promise<PendingSubmission[] | VerifiedSubmission[]> {
  const filePath = dataFilePath(type)

  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const json = JSON.parse(raw) as unknown[]
    const schema =
      type === 'pending' ? PendingSubmissionSchema : VerifiedSubmissionSchema

    return json.map(item => schema.parse(item)) as
      | PendingSubmission[]
      | VerifiedSubmission[]
  } catch {
    return []
  }
}

export async function writeSubmissions(
  type: 'pending' | 'verified',
  data: unknown[]
): Promise<void> {
  const filePath = dataFilePath(type)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}
