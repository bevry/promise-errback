/** Have a callback (errback) handle a promise's resolution (success) or rejection (error) */
export default function promiseErrback<T, R>(
	promise: Promise<T>,
	errback: (err: any, value?: T) => R | Promise<R>
): Promise<R> {
	return promise.then(
		(value) => errback(null, value),
		(error: any) => errback(error)
	)
}
