// external
import { equal, undef, errorEqual } from 'assert-helpers'
import TaskGroup from 'taskgroup'
const { Task } = TaskGroup
import kava from 'kava'

// local
import promiseErrback from './index.js'

// tests
const promiseValue = 'promise success'
const errbackValue = 'errback success'
const promiseError = new Error('promise failure')
const errbackError = new Error('errback failure')
const successForms: {
	[name: string]: Promise<string> | (() => string | Promise<string>)
} = {
	resolve: Promise.resolve(promiseValue),
	syncValue: () => promiseValue,
	syncResolve: () => Promise.resolve(promiseValue),
	asyncValue: async () => promiseValue,
	asyncResolve: async () => Promise.resolve(promiseValue),
}
const failureForms: {
	[name: string]: () => never | Promise<never>
} = {
	syncReject: () => Promise.reject(promiseError),
	syncThrow: () => {
		throw promiseError
	},
	asyncReject: async () => Promise.reject(promiseError),
	asyncThrow: async () => {
		throw promiseError
	},
}
kava.suite('promiseErrback', function (suite, test) {
	for (const successFormName of Object.keys(successForms)) {
		const successForm = successForms[successFormName]
		suite('success form: ' + successFormName, function (suite, test) {
			test('promise success to errback', function (done) {
				promiseErrback(successForm, function (err, value) {
					equal(err, null, 'promise success should send no error to errback')
					equal(
						value,
						promiseValue,
						'promise success should send value to errback'
					)
					return errbackValue
				})
					.then(function (value) {
						equal(
							value,
							errbackValue,
							'promise resolver should succeed with errback success'
						)
						done()
					})
					.catch(function () {
						done(
							new Error('promise resolver should not fail with errback success')
						)
					})
			})
			test('promise success to errback failure', function (done) {
				promiseErrback(successForm, function (err, value) {
					equal(err, null, 'promise success should send no error to errback')
					equal(
						value,
						promiseValue,
						'promise success should send value to errback'
					)
					throw errbackError
				})
					.then(function (value) {
						done(
							new Error(
								'promise resolver should not succeed on errback failure'
							)
						)
					})
					.catch(function (err) {
						errorEqual(
							err,
							errbackError,
							'promise resolver should fail with errback failure'
						)
						done()
					})
			})
			test('promise success directly to kava:test:done as expected', function (done) {
				promiseErrback(successForm, done)
			})
		})
	}
	for (const failureFormName of Object.keys(failureForms)) {
		const failureForm = failureForms[failureFormName]
		suite('failure form: ' + failureFormName, function (suite, test) {
			test('promise failure to errback', function (done) {
				promiseErrback(failureForm, function (err, value) {
					errorEqual(
						err,
						promiseError,
						'promise failure should send error to the errback'
					)
					undef(value, 'promise failure should not send a value to the errback')
					return errbackValue
				})
					.then(function (value) {
						equal(
							value,
							errbackValue,
							'promise resolver should succeed with errback success'
						)
						done()
					})
					.catch(function () {
						done(
							new Error('promise resolver should not fail with errback success')
						)
					})
			})
		})
		test('promise failure to errback failure', function (done) {
			promiseErrback(
				Promise.resolve().then(failureForm),
				function (err, value) {
					errorEqual(
						err,
						promiseError,
						'promise failure should send error to the errback'
					)
					undef(value, 'promise failure should not send a value to the errback')
					throw errbackError
				}
			)
				.then(function () {
					done(
						new Error('promise resolver should not succeed on errback failure')
					)
				})
				.catch(function (err) {
					errorEqual(
						err,
						errbackError,
						'promise resolver should fail with errback failure'
					)
					done()
				})
		})
		test('promise failure to task as expected', function (this: any, done) {
			const task = new Task(function (next: any) {
				promiseErrback(Promise.resolve().then(failureForm), next)
					.then(function (value) {
						undef(value, 'task:next should not have returned a value')
					})
					.catch(function () {
						done(
							new Error(
								'promise resolver should not have failed when task:next catches the error'
							)
						)
					})
			})
			task.done(function (err: any, value: any) {
				errorEqual(
					err,
					promiseError,
					'task:done should have received the promise failure'
				)
				undef(value, 'task:done should not have received a value')
				done()
			})
			task.run()
		})
	}
})

// not actually desirable, see comments in index.ts
//
// suite('promiseErrbackTick', function (suite, test) {
// 	test('promise success to errback', function (done) {
// 		promiseErrbackTick(
// 			Promise.resolve().then(syncWinner),
// 			function (err, value) {
// 				equal(err, null, 'promise success should send no error to errback')
// 				equal(
// 					value,
// 					promiseValue,
// 					'promise success should send value to errback',
// 				)
// 				return errbackValue
// 			},
// 		)
// 			.then(function (value) {
// 				equal(
// 					value,
// 					promiseValue,
// 					'promise resolver should have received promise success value on promise success',
// 				)
// 				done()
// 			})
// 			.catch(function () {
// 				done(new Error('promise resolver should never fail'))
// 			})
// 	})
// 	test('promise failure to errback', function (done) {
// 		promiseErrbackTick(
// 			Promise.resolve().then(syncLoser),
// 			function (err, value) {
// 				errorEqual(
// 					err,
// 					promiseError,
// 					'promise failure should send error to the errback',
// 				)
// 				undef(value, 'promise failure should not send a value to the errback')
// 				return errbackValue
// 			},
// 		)
// 			.then(function (value) {
// 				undef(
// 					value,
// 					'promise resolver should not have received a value on promise failure',
// 				)
// 				done()
// 			})
// 			.catch(function () {
// 				done(new Error('promise resolver should never fail'))
// 			})
// 	})
// 	test('promise success directly to kava:test:done as expected', function (done) {
// 		promiseErrbackTick(Promise.resolve().then(syncWinner), done)
// 	})
// 	test('promise success to task as expected', function (this: any, done) {
// 		const task = new Task(function (next: any) {
// 			promiseErrbackTick(Promise.resolve().then(syncWinner), next)
// 				.then(function (value) {
// 					equal(
// 						value,
// 						promiseValue,
// 						'promise resolver should have received promise success value on promise success',
// 					)
// 				})
// 				.catch(function (err) {
// 					done(new Error('promise resolver should never fail'))
// 				})
// 		})
// 		task.done(function (err: any, value: any) {
// 			equal(
// 				err,
// 				null,
// 				'task should not have received an error on promise success',
// 			)
// 			equal(
// 				value,
// 				promiseValue,
// 				'task should have received the promise success value on promise success',
// 			)
// 			done()
// 		})
// 		task.run()
// 	})
// 	test('promise failure to task as expected', function (this: any, done) {
// 		const task = new Task(function (next: any) {
// 			promiseErrbackTick(Promise.resolve().then(syncLoser), next)
// 				.then(function (value) {
// 					undef(
// 						value,
// 						'promise resolver should not have received a value on promise failure',
// 					)
// 				})
// 				.catch(function () {
// 					done(new Error('promise resolver should never fail'))
// 				})
// 		})
// 		task.done(function (err: any, value: any) {
// 			errorEqual(
// 				err,
// 				promiseError,
// 				'task should have received the promise failure',
// 			)
// 			undef(value, 'task should not have received any value')
// 			done()
// 		})
// 		task.run()
// 	})
// 	test('promise success to errback failure to task as expected', function (this: any, done) {
// 		const task = new Task(function (next: any) {
// 			// never call next, but provide it so we capture the async throw
// 			promiseErrbackTick(
// 				Promise.resolve().then(syncWinner),
// 				function (err, value) {
// 					equal(err, null, 'promise success should send no error to errback')
// 					equal(
// 						value,
// 						promiseValue,
// 						'promise success should send value to errback',
// 					)
// 					throw errbackError
// 				},
// 			)
// 				.then(function (value) {
// 					equal(
// 						value,
// 						promiseValue,
// 						'promise resolver should have received promise success value on promise success',
// 					)
// 				})
// 				.catch(function (err) {
// 					done(new Error('promise resolver should never fail'))
// 				})
// 		})
// 		task.done(function (err: any, value: any) {
// 			errorEqual(
// 				err,
// 				errbackError,
// 				'task should have received errback failure',
// 			)
// 			undef(value, 'task should not have received any value')
// 			done()
// 		})
// 		task.run()
// 	})
// })
