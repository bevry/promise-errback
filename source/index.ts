/**
 * Forward the resolution/rejection of a resolvable to an errback; forwarding the resolution/rejection of the errback to ourself.
 * Not following this with a catch in case of errback failures is fine, as it will trigger an unhandled promise rejection.
 * This is also superior to other options, as it covers promise and errback throws, rejections, and uncaught exceptions and uncaught rejections
 */
export function promiseErrback<Value, Result>(
	promise: Promise<Value> | (() => Value | Promise<Value>),
	errback: (err: any, value?: Value) => Result | Promise<Result>
): Promise<Result> {
	if (typeof promise === 'function') {
		try {
			promise = Promise.resolve(promise())
		} catch (error) {
			promise = Promise.reject(error)
		}
	}
	return Promise.resolve(promise).then(
		(value) => errback(null, value),
		(error: any) => errback(error)
	)
}
export default promiseErrback

// the below variants one can think of as desired, but in reality they are not, as if the errback returns Promise.reject, it won't be caught, also if it throws, it won't be caught on Node.js versions less than 8
//
// /** setImmediate for Node.js and Web Browsers */
// function setImmediateWrapper(callback: () => void) {
// 	setTimeout(callback, 0)
// }
//
// /**
//  * Take a resolvable and trigger an errback; capturing the result and errors from the promise and the errback, but still returning the promise result if there wasn't a failure.
//  * Not following this with a catch in case of errback failures is fine, as it will trigger an unhandled promise rejection.
//  */
// export function promiseErrbackFinally<Value>(
// 	promise: Promise<Value> | (() => Value | Promise<Value>),
// 	errback: (err: any, value?: Value) => unknown,
// ): Promise<Value | void> {
// 	if (typeof promise === 'function') {
// 		try {
// 			promise = Promise.resolve(promise())
// 		} catch (error) {
// 			promise = Promise.reject(error)
// 		}
// 	}
// 	return promise.then(
// 		function (value) {
// 			errback(null, value)
// 			return value
// 		},
// 		function (error: any) {
// 			errback(error)
// 		}
// 	)
// }

// /**
//  * Take a resolvable and trigger an errback; capturing the result and errors from the promise but not from the errback.
//  * Note that on Node.js < v8, if the errback throws the error will be lost, even with TaskGroup and Kava.
// */
// export function promiseErrbackTick<Value>(
// 	promise: Promise<Value> | (() => Value | Promise<Value>),
// 	errback: (err: any, value?: Value) => unknown,
// ): Promise<Value | void> {
// 	if (typeof promise === 'function') {
// 		try {
// 			promise = Promise.resolve(promise())
// 		} catch (error) {
// 			promise = Promise.reject(error)
// 		}
// 	}
// 	return promise.then(
// 		function (value) {
// 			setImmediateWrapper(function () {
// 				errback(null, value)
// 			})
// 			return value
// 		},
// 		function (error: any) {
// 			setImmediateWrapper(function () {
// 				errback(error)
// 			})
// 		},
// 	)
// }
