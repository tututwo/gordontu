// Run with `node "src/routes/(home)/contact/lines.check.js"`: a name sets off a joke by a whole word,
// in any case, the first joke in the list wins, and everyone else is simply met.
import { draw, jokeFor, jokes } from './lines.js';

/** @param {unknown} condition @param {string} message */
function assert(condition, message) {
	if (!condition) throw new Error(message);
}

/** @param {string} name */
const joke = (name) => jokes[jokeFor(name)]?.names[0];

assert(joke('Winston') === 'winston', 'Winston is a joke');
assert(joke('winston chen') === 'winston', 'any case, any word');
assert(joke('Jennifer Marlon') === 'jen', 'Jennifer is Jenn');
assert(joke('Jenn') === 'jen' && joke('Jen') === 'jen', 'Jenn and Jen');
assert(joke('Jenkins') === undefined && joke('Jenny') === undefined, 'only whole words');
assert(joke('Heather Winston') === 'winston', 'the first in the list wins');
assert(joke('Ziqi Wang') === 'luisa' && joke('Luisa Vasquez') === 'luisa', 'Luisa and Qiqi');
assert(joke('Zaba') === 'zaba' && joke('ZABABA') === 'zaba', 'Zaba and Zababa');
assert(joke('Karlane') === undefined, 'no part of a word');

const words = draw();
assert(words.meet('Jennifer').startsWith('Hey Jenn') || words.meet('Jennifer').startsWith('Jenn'), 'Jenn to begin with');
assert(words.meet('Jennifer').includes('Jennifer'), 'then as typed');
assert(words.meet('Winston') === words.meet('winston'), 'a joke is drawn once a visit');
assert(words.meet('Alex').includes('Alex'), 'everyone else is met');

console.log('lines: ok');
