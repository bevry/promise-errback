import { equal, undef, errorEqual } from 'assert-helpers'
import kava from 'kava'

import promiseErrback from './index.js'

kava.suite('@bevry/promise-errback', function (suite, test) {
	test('success as expected', function (done) {
		promiseErrback(
			Promise.resolve().then(() => {
				return 'first result'
			}),
			function (err, value) {
				equal(err, null, 'rejection was as expected')
				equal(value, 'first result', 'result was as expected')
				return 'new result'
			},
		)
			.then((value) => {
				equal(value, 'new result', 'new result was as expected')
				done()
			})
			.catch(function (err) {
				done(new Error('should not have errored: ' + err))
			})
	})
	test('rejection as expected', function (done) {
		promiseErrback(
			Promise.resolve().then(() => {
				return Promise.reject('first rejection')
			}),
			function (err, value) {
				errorEqual(err, 'first rejection', 'rejection was as expected')
				undef(value, 'result was as expected')
				return 'new result'
			},
		)
			.then((value) => {
				equal(value, 'new result', 'new result was as expected')
				done()
			})
			.catch(function (err) {
				done(new Error('should not have errored: ' + err))
			})
	})
	test('double rejection as expected', function (done) {
		promiseErrback(
			Promise.resolve().then(() => {
				return Promise.reject('first rejection')
			}),
			function (err, value) {
				errorEqual(err, 'first rejection', 'rejection was as expected')
				undef(value, 'result was as expected')
				return Promise.reject('second rejection')
			},
		)
			.then((value) => {
				done(new Error('should not have succeeded: ' + value))
			})
			.catch(function (err) {
				errorEqual(err, 'second rejection', 'new rejection was as expected')
				done()
			})
	})
	test('success to done as expected', function (done) {
		promiseErrback(
			Promise.resolve().then(() => {
				return 'success'
			}),
			done,
		)
	})
	// obviously can't test rejection to done, as that will cause the test to fail
})
