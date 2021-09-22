package util

import "time"

type RetryOptions struct {
	Times int
	Wait  time.Duration
}

func Retry(f func() error, options *RetryOptions) error {
	var err error

	for i := 0; i < options.Times; i++ {
		err = f()
		if err == nil {
			break
		}

		if i+1 < options.Times {
			time.Sleep(options.Wait)
		}
	}

	return err
}
