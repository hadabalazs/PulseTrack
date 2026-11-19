import test from 'node:test';
import assert from 'node:assert/strict';
import { addDays, format } from 'date-fns';
import { evaluateMedals, groupMedals } from '../src/lib/medals/evaluateMedals.js';
import { MEDAL_CATALOG, scopeForSport } from '../src/lib/medals/catalog.js';
const now = new Date(2026,11,31,12);
const log = (date, exercise = 'Running', extra = {}) => ({ id: `${date}-${exercise}`, date, exercise, ...extra });
const days = (start, count, sport = 'Running') => Array.from({length:count},(_,i) => log(format(addDays(new Date(`${start}T12:00:00`),i),'yyyy-MM-dd'),sport));
const matching = (logs, id, scope = scopeForSport('Running'), at = now) => evaluateMedals(logs,at).filter(award => award.definitionId === id && award.scopeKey === scope);

test('weekly repeats are unique editions, independent of flags and duplicate sessions', () => {
  const logs = [...days('2026-11-02',5),...days('2026-11-09',3)];
  logs.push({...logs[0]},log('2026-11-02','Running',{id:'another',excludePayment:true,highlighted:true}));
  assert.equal(matching(logs,'week-3').length,2);assert.equal(matching(logs,'week-5').length,1);
  assert.equal(matching(logs,'week-3')[0].earnedDate,'2026-11-11');
  const groups = groupMedals(evaluateMedals(logs,now),{scope:scopeForSport('Running')});
  assert.equal(groups.find(group=>group.definition.id==='week-3').count,2);
  assert.equal(matching(logs.filter(entry=>entry.date!=='2026-11-11'),'week-3').length,1);
});
test('month and year thresholds have exact earned dates and appear in that week', () => {
  const logs = days('2026-01-01',200);
  assert.equal(matching(logs,'month-12').find(a=>a.periodKey==='2026-01').earnedDate,'2026-01-12');
  assert.equal(matching(logs,'year-100')[0].earnedDate,'2026-04-10');
  assert.equal(matching(logs,'year-200')[0].earnedDate,'2026-07-19');
  const week = groupMedals(evaluateMedals(logs,now),{scope:scopeForSport('Running'),weekStart:new Date(2026,3,6)});
  assert.ok(week.some(group=>group.definition.id==='year-100'));
  assert.equal(matching(days('2026-01-01',19),'month-20').length,0);
});
test('lifetime tiers count days, separate scopes and recompute after edits', () => {
  const logs = [...days('2026-02-01',26),...days('2026-02-01',5,'Swimming')];
  for (const tier of [1,10,25]) assert.equal(matching(logs,`active-${tier}`).length,1);
  assert.equal(matching(logs,'active-50').length,0);assert.equal(matching(logs,'active-10',scopeForSport('Swimming')).length,0);
  assert.equal(matching(logs,'active-25','all').length,1);
  assert.equal(matching(logs.filter(entry=>entry.date<'2026-02-25'),'active-25').length,0);
});
test('exploration records the first actual crossing and every monthly/weekly edition', () => {
  const logs = [log('2026-11-02'),log('2026-11-03','Swimming'),log('2026-11-04','Yoga'),log('2026-11-05','Cycling'),log('2026-11-06'),log('2026-11-09'),log('2026-11-10','Swimming'),log('2026-11-11','Yoga')];
  assert.equal(matching(logs,'week-explore','all').length,2);assert.equal(matching(logs,'month-explore','all').length,1);
  assert.equal(matching(logs,'explore-3','all')[0].earnedDate,'2026-11-04');
  assert.equal(matching(logs,'explore-5','all').length,0);
});
test('distance ladders use sport-specific positive metres and deduplicate IDs', () => {
  const logs = [log('2026-01-01','Swimming',{distance:5000}),log('2026-01-02','Swimming',{distance:20000}),log('2026-01-01','Cycling',{distance:100000}),log('2026-01-03','Swimming',{distance:-10000})];
  logs.push({...logs[0]});
  assert.equal(matching(logs,'distance-5',scopeForSport('Swimming')).length,1);
  assert.equal(matching(logs,'distance-25',scopeForSport('Swimming'))[0].earnedDate,'2026-01-02');
  assert.equal(matching(logs,'distance-100',scopeForSport('Cycling')).length,1);
  assert.equal(matching(logs,'distance-100',scopeForSport('Swimming')).length,0);
});
test('occasions repeat by year, anniversary and return are once, Yoga Day is excluded', () => {
  const logs=[log('2024-01-01'),log('2024-04-22'),log('2025-01-01'),log('2025-04-22'),log('2025-06-21','Yoga')];
  assert.equal(matching(logs,'fresh-start').length,2);assert.equal(matching(logs,'earth-day').length,2);
  assert.equal(matching(logs,'first-year','all').length,1);assert.equal(matching(logs,'return','all').length,1);
  assert.ok(MEDAL_CATALOG.every(def=>!def.id.includes('yoga')));
  assert.equal(matching([log('2026-01-01'),log('2026-01-15')],'return','all').length,0);
  assert.equal(matching([log('2026-01-01'),log('2026-01-16')],'return','all').length,1);
});
test('all seasons requires all twelve distinct months in the same calendar year', () => {
  const logs=Array.from({length:12},(_,i)=>log(`2026-${String(i+1).padStart(2,'0')}-01`));
  assert.equal(matching(logs,'year-months','all')[0].earnedDate,'2026-12-01');
  assert.equal(matching(logs.slice(0,11),'year-months','all').length,0);
});
test('calendar weeks cross years, leap dates are valid, and invalid/future logs are ignored', () => {
  const logs=[log('2025-12-31'),log('2026-01-01'),log('2026-01-02'),null,{},log('2026-02-30'),log('2027-01-01')];
  const original=JSON.stringify(logs);assert.equal(matching(logs,'week-3')[0].periodKey,'2025-12-29');assert.equal(JSON.stringify(logs),original);
  assert.equal(matching(days('2024-02-28',3),'week-3')[0].earnedDate,'2024-03-01');
  assert.deepEqual(evaluateMedals(logs,new Date('invalid')),[]);
});
test('custom sport names including all never collide with the aggregate scope', () => {
  const awards=evaluateMedals(days('2026-11-02',3,'all'),now);
  assert.equal(awards.filter(a=>a.definitionId==='week-3').length,2);
  assert.ok(awards.some(a=>a.scopeKey==='sport:all'));assert.ok(awards.some(a=>a.scopeKey==='all'));
});
test('metal difficulty follows each sport ladder without changing award identity', () => {
  const logs = [log('2026-11-02','Swimming',{distance:25000}), log('2026-11-03','Running',{distance:25000}), log('2026-11-04','Cycling',{distance:100000})];
  const awards = evaluateMedals(logs, now), snapshot = JSON.stringify(awards);
  const groups = groupMedals(awards);
  assert.equal(groups.find(g=>g.definition.id==='distance-25'&&g.scopeKey==='sport:Swimming').definition.metal,'silver');
  assert.equal(groups.find(g=>g.definition.id==='distance-25'&&g.scopeKey==='sport:Running').definition.metal,'bronze');
  assert.equal(groups.find(g=>g.definition.id==='distance-100'&&g.scopeKey==='sport:Cycling').definition.metal,'bronze');
  assert.equal(MEDAL_CATALOG.find(d=>d.id==='year-200').metal,'platinum');
  assert.equal(MEDAL_CATALOG.find(d=>d.id==='month-20').metal,'gold');
  assert.equal(JSON.stringify(awards),snapshot);
});
test('daily streaks unlock at exact thresholds, repeat after a gap, and deduplicate dates', () => {
  const first = days('2026-10-01', 8), second = days('2026-10-12', 7);
  const logs = [...second, ...first, {...first[0],id:'duplicate-day'}].reverse();
  const awards = matching(logs,'streak-daily-7','sport:Running');
  assert.deepEqual(awards.map(a=>a.earnedDate).sort(),['2026-10-07','2026-10-18']);
  assert.equal(new Set(awards.map(a=>a.awardId)).size,2);
  assert.equal(awards.find(a=>a.earnedDate==='2026-10-07').evidenceLogIds.length,7);
  assert.equal(matching(first.slice(0,6),'streak-daily-7').length,0);
  assert.equal(matching(first.filter(l=>l.date!=='2026-10-04'),'streak-daily-7').length,0);
  const extended = matching([...first,...days('2026-10-09',3)],'streak-daily-7','sport:Running');
  assert.equal(extended[0].awardId,awards.find(a=>a.earnedDate==='2026-10-07').awardId);
});
test('weekly streaks use Monday calendar weeks and earliest workouts across year boundaries', () => {
  const logs = ['2025-12-15','2025-12-22','2025-12-29','2026-01-04','2026-01-05','2026-01-06'].map(date=>log(date));
  const award = matching(logs,'streak-weekly-4','sport:Running')[0];
  assert.equal(award.earnedDate,'2026-01-05');assert.equal(award.periodKey,'2025-12-15');
  assert.equal(award.evidenceLogIds.length,4);
  assert.equal(matching(logs.filter(l=>l.date!=='2025-12-22'),'streak-weekly-4').length,0);
});
test('monthly streaks cross years, ignore repeated sessions and reset for missing months', () => {
  const logs = ['2025-11-30','2025-12-30','2025-12-01','2026-01-20','2026-01-03','2026-03-01','2026-04-01','2026-05-01'].map(date=>log(date));
  const awards = matching(logs,'streak-monthly-3','sport:Running');
  assert.deepEqual(awards.map(a=>a.earnedDate).sort(),['2026-01-03','2026-05-01']);
  assert.equal(matching(logs,'streak-monthly-6').length,0);
  assert.equal(matching(logs.filter(l=>!l.date.startsWith('2025-12')),'streak-monthly-3','sport:Running').length,1);
});
test('streaks separate sport and aggregate scopes and exclude future workouts', () => {
  const logs = [log('2026-11-01','Running'),log('2026-11-02','Swimming'),log('2026-11-03','Running')];
  assert.equal(matching(logs,'streak-daily-3','all').length,1);
  assert.equal(matching(logs,'streak-daily-3','sport:Running').length,0);
  assert.equal(evaluateMedals(logs,new Date(2026,10,2,12)).filter(a=>a.definitionId==='streak-daily-3').length,0);
  const awards=evaluateMedals(days('2026-01-01',30),now);
  assert.deepEqual(groupMedals(awards,{scope:'sport:Running',family:'streaks'}).filter(g=>g.definition.cadence==='daily').map(g=>g.definition.metal).sort(),['bronze','gold','platinum','silver']);
});
test('weekly and monthly platinum thresholds require all consecutive periods', () => {
  const weeks = Array.from({length:26},(_,i)=>log(format(addDays(new Date(2024,0,1,12),i*7),'yyyy-MM-dd')));
  const months = Array.from({length:24},(_,i)=>log(`${2024+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}-01`));
  assert.equal(matching(weeks.slice(0,-1),'streak-weekly-26').length,0);
  assert.equal(matching(weeks,'streak-weekly-26','sport:Running')[0].earnedDate,'2024-06-24');
  assert.equal(matching(months.slice(0,-1),'streak-monthly-24').length,0);
  assert.equal(matching(months,'streak-monthly-24','sport:Running')[0].earnedDate,'2025-12-01');
});
test('52-week and 18-month streaks unlock exactly once at their thresholds', () => {
  const weeks = Array.from({length:53},(_,i)=>log(format(addDays(new Date(2024,0,1,12),i*7),'yyyy-MM-dd')));
  const months = Array.from({length:25},(_,i)=>log(`${2024+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}-01`));
  for (const [logs, id, count, earnedDate] of [[weeks,'streak-weekly-52',52,'2024-12-23'],[months,'streak-monthly-18',18,'2025-06-01']]) {
    assert.equal(matching(logs.slice(0,count-1),id).length,0);
    const awards=matching(logs,id,'sport:Running');
    assert.equal(awards.length,1);assert.equal(awards[0].earnedDate,earnedDate);
    assert.equal(awards[0].evidenceLogIds.length,count);
    assert.equal(matching(logs.slice(0,count).filter((_,i)=>i!==5),id).length,0);
    assert.equal(MEDAL_CATALOG.find(d=>d.id===id).metal,'platinum');
  }
  assert.equal(MEDAL_CATALOG.find(d=>d.id==='streak-monthly-24').metal,'platinum');
  assert.equal(matching(months,'streak-monthly-24','sport:Running').length,1);
});
