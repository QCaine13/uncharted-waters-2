import { STAFF_RETURNED_EVENT_ID } from './content/arcs/joao/massawa';
import { getStoryPortName } from './portStoryNames';

test('renames only port 75 after the Staff hand-in without changing the raw port', () => {
  expect(getStoryPortName('75', [])).toBe('Massawa');
  expect(getStoryPortName('75', [STAFF_RETURNED_EVENT_ID])).toBe('Axum');
  expect(getStoryPortName('1', [STAFF_RETURNED_EVENT_ID])).toBe('Lisbon');
});
