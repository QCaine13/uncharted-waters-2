import characterData from '../../../data/characterData';
import getSailor from '../../../data/sailorData';
import { compileStoryContent } from '../../core/registry';
import { characterId } from '../../core/types';
import { storyRelationships } from '../relationships';
import { storyCharacters } from '.';

describe('canonical Lisbon characters', () => {
  const byId = (id: string) =>
    storyCharacters.find((character) => character.id === id);

  test('preserves every legacy identity, English name, color, role, and sailor link', () => {
    expect(storyCharacters).toHaveLength(17);
    expect(new Set(storyCharacters.map(({ id }) => id)).size).toBe(17);

    expect(byId('joao')).toEqual({
      id: characterId('joao'),
      names: { en: 'João' },
      role: 'protagonist',
      dialogueStyle: { color: 'text-blue-600' },
      sailorId: '1',
      legacyCharacterId: '1',
    });
    expect(byId('duke-franco')).toEqual({
      id: characterId('duke-franco'),
      names: { en: 'Duke Franco' },
      role: 'family',
      dialogueStyle: { color: 'text-red-600' },
      legacyCharacterId: '19',
    });
    expect(byId('duchess-christiana')).toEqual({
      id: characterId('duchess-christiana'),
      names: { en: 'Duchess Christiana' },
      role: 'family',
      dialogueStyle: { color: 'text-yellow-600' },
      legacyCharacterId: '20',
    });
    expect(byId('butler-marco')).toEqual({
      id: characterId('butler-marco'),
      names: { en: 'Butler Marco' },
      role: 'npc',
      dialogueStyle: { color: 'text-blue-900' },
      legacyCharacterId: '7',
    });
    expect(byId('rocco')).toEqual({
      id: characterId('rocco'),
      names: { en: 'Old Sea Hand Rocco' },
      role: 'companion',
      dialogueStyle: { color: 'text-amber-800' },
      sailorId: '32',
      legacyCharacterId: '32',
    });
    expect(byId('enrico')).toEqual({
      id: characterId('enrico'),
      names: { en: 'Brother Enrico' },
      role: 'companion',
      dialogueStyle: { color: 'text-purple-800' },
      sailorId: '33',
      legacyCharacterId: '33',
    });
    expect(byId('carlotta')).toEqual({
      id: characterId('carlotta'),
      names: { en: 'Carlotta, Owner of the Pub' },
      role: 'npc',
      dialogueStyle: { color: 'text-amber-600' },
      legacyCharacterId: '98',
    });
    expect(byId('lucia')).toEqual({
      id: characterId('lucia'),
      names: { en: 'Lucia the Waitress' },
      role: 'npc',
      dialogueStyle: { color: 'text-pink-600' },
      legacyCharacterId: '99',
    });
    expect(byId('domingo')).toEqual({
      id: characterId('domingo'),
      names: { en: 'Domingo', zh: '多明戈' },
      role: 'companion',
      dialogueStyle: { color: 'text-emerald-700' },
      sailorId: '34',
      legacyCharacterId: '34',
    });
    expect(byId('m2-relief-captain')).toEqual({
      id: characterId('m2-relief-captain'),
      names: { en: 'Relief Captain', zh: '代理船长' },
      role: 'companion',
      dialogueStyle: { color: 'text-slate-600' },
      sailorId: 'm2-relief-captain',
    });
    expect(byId('m3-relief-captain')).toEqual({
      id: characterId('m3-relief-captain'),
      names: { en: 'Second Relief Captain', zh: '第二代理船长' },
      role: 'companion',
      dialogueStyle: { color: 'text-slate-600' },
      sailorId: 'm3-relief-captain',
    });
    expect(byId('kahn')).toEqual({
      id: characterId('kahn'),
      names: { en: 'Antonio Kahn', zh: '安东尼奥·卡恩' },
      role: 'antagonist',
      dialogueStyle: { color: 'text-red-800' },
    });
    expect(byId('katarina')).toEqual({
      id: characterId('katarina'),
      names: { en: 'Katarina Erantzo', zh: '卡特琳娜·艾兰茨' },
      role: 'antagonist',
      dialogueStyle: { color: 'text-rose-700' },
    });
    expect(byId('ali')).toEqual({
      id: characterId('ali'),
      names: { en: 'Ali Vezas', zh: '阿兰·维斯特' },
      role: 'npc',
      dialogueStyle: { color: 'text-teal-700' },
    });
    expect(byId('sasha')).toEqual({
      id: characterId('sasha'),
      names: { en: 'Sasha', zh: '莎夏' },
      role: 'npc',
      dialogueStyle: { color: 'text-violet-700' },
    });
    expect(byId('pietro')).toEqual({
      id: characterId('pietro'),
      names: { en: 'Pietro', zh: '皮耶德' },
      role: 'npc',
      dialogueStyle: { color: 'text-slate-600' },
    });
    expect(byId('taphiel')).toEqual({
      id: characterId('taphiel'),
      names: { en: 'Taphiel', zh: '塔菲尔' },
      role: 'npc',
      dialogueStyle: { color: 'text-slate-600' },
    });

    const sailorIds = storyCharacters
      .map(({ sailorId }) => sailorId)
      .filter((sailorId): sailorId is string => Boolean(sailorId));
    expect(sailorIds).toEqual([
      '1',
      '32',
      '33',
      '34',
      'm2-relief-captain',
      'm3-relief-captain',
    ]);
    expect(sailorIds).toHaveLength(new Set(sailorIds).size);

    expect(getSailor('m2-relief-captain')).toEqual({
      name: 'Relief Captain',
      age: 30,
      stats: {
        leadership: 50,
        seamanship: 50,
        knowledge: 50,
        intuition: 50,
        courage: 50,
        swordplay: 50,
        charm: 50,
        luck: 50,
      },
      navigationLevel: 1,
      battleLevel: 1,
      skills: [],
    });
    expect(getSailor('m3-relief-captain')).toEqual({
      name: 'Second Relief Captain',
      age: 30,
      stats: {
        leadership: 50,
        seamanship: 50,
        knowledge: 50,
        intuition: 50,
        courage: 50,
        swordplay: 50,
        charm: 50,
        luck: 50,
      },
      navigationLevel: 1,
      battleLevel: 1,
      skills: [],
    });
  });

  test('derives the unchanged legacy dialogue lookup from canonical records', () => {
    expect(characterData).toEqual({
      '1': { name: 'João', color: 'text-blue-600' },
      '7': { name: 'Butler Marco', color: 'text-blue-900' },
      '19': { name: 'Duke Franco', color: 'text-red-600' },
      '20': { name: 'Duchess Christiana', color: 'text-yellow-600' },
      '32': { name: 'Old Sea Hand Rocco', color: 'text-amber-800' },
      '33': { name: 'Brother Enrico', color: 'text-purple-800' },
      '98': { name: 'Carlotta, Owner of the Pub', color: 'text-amber-600' },
      '99': { name: 'Lucia the Waitress', color: 'text-pink-600' },
      '34': { name: 'Domingo', color: 'text-emerald-700' },
    });
  });
});

describe('canonical Lisbon relationships', () => {
  test('declares each approved relationship once and compiles its reciprocal edge', () => {
    expect(
      storyRelationships.map(({ id, from, to, type, reciprocal }) => ({
        id,
        from,
        to,
        type,
        reciprocal,
      })),
    ).toEqual([
      {
        id: 'joao.duke-franco.parent',
        from: 'duke-franco',
        to: 'joao',
        type: 'parent',
        reciprocal: 'child',
      },
      {
        id: 'joao.duchess-christiana.parent',
        from: 'duchess-christiana',
        to: 'joao',
        type: 'parent',
        reciprocal: 'child',
      },
      {
        id: 'joao.rocco.mentor',
        from: 'rocco',
        to: 'joao',
        type: 'mentor',
        reciprocal: 'student',
      },
      {
        id: 'joao.rocco.companion',
        from: 'rocco',
        to: 'joao',
        type: 'companion',
        reciprocal: 'companion',
      },
      {
        id: 'joao.enrico.companion',
        from: 'enrico',
        to: 'joao',
        type: 'companion',
        reciprocal: 'companion',
      },
      {
        id: 'joao.carlotta.acquaintance',
        from: 'carlotta',
        to: 'joao',
        type: 'acquaintance',
        reciprocal: 'acquaintance',
      },
      {
        id: 'joao.lucia.acquaintance',
        from: 'lucia',
        to: 'joao',
        type: 'acquaintance',
        reciprocal: 'acquaintance',
      },
      {
        id: 'joao.domingo.companion',
        from: 'domingo',
        to: 'joao',
        type: 'companion',
        reciprocal: 'companion',
      },
      {
        id: 'joao.kahn.rival',
        from: 'kahn',
        to: 'joao',
        type: 'rival',
        reciprocal: 'rival',
      },
      {
        id: 'joao.katarina.enemy',
        from: 'katarina',
        to: 'joao',
        type: 'enemy',
        reciprocal: 'enemy',
      },
      {
        id: 'joao.ali.acquaintance',
        from: 'ali',
        to: 'joao',
        type: 'acquaintance',
        reciprocal: 'acquaintance',
      },
      {
        id: 'ali.sasha.sibling',
        from: 'ali',
        to: 'sasha',
        type: 'sibling',
        reciprocal: 'sibling',
      },
      {
        id: 'joao.pietro.acquaintance',
        from: 'pietro',
        to: 'joao',
        type: 'acquaintance',
        reciprocal: 'acquaintance',
      },
      {
        id: 'joao.taphiel.acquaintance',
        from: 'taphiel',
        to: 'joao',
        type: 'acquaintance',
        reciprocal: 'acquaintance',
      },
    ]);

    const compiled = compileStoryContent(
      {
        characters: storyCharacters,
        relationships: storyRelationships,
        arcs: [],
        events: [],
      },
      'strict',
    );
    const compiledEdges = [...compiled.relationshipsByCharacter].flatMap(
      ([from, relationships]) =>
        relationships.map(({ to, type }) => `${from}:${type}:${to}`),
    );

    expect(new Set(compiledEdges)).toEqual(
      new Set([
        'duke-franco:parent:joao',
        'joao:child:duke-franco',
        'duchess-christiana:parent:joao',
        'joao:child:duchess-christiana',
        'rocco:mentor:joao',
        'joao:student:rocco',
        'rocco:companion:joao',
        'joao:companion:rocco',
        'enrico:companion:joao',
        'joao:companion:enrico',
        'carlotta:acquaintance:joao',
        'joao:acquaintance:carlotta',
        'lucia:acquaintance:joao',
        'joao:acquaintance:lucia',
        'domingo:companion:joao',
        'joao:companion:domingo',
        'kahn:rival:joao',
        'joao:rival:kahn',
        'katarina:enemy:joao',
        'joao:enemy:katarina',
        'ali:acquaintance:joao',
        'joao:acquaintance:ali',
        'ali:sibling:sasha',
        'sasha:sibling:ali',
        'pietro:acquaintance:joao',
        'joao:acquaintance:pietro',
        'taphiel:acquaintance:joao',
        'joao:acquaintance:taphiel',
      ]),
    );
    expect(compiledEdges).toHaveLength(28);
    expect(compiled.diagnostics).toEqual([]);
  });
});
