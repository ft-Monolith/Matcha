import type { DetailedHTMLProps, Dispatch, HTMLAttributes, SetStateAction } from 'react';

export type ReactSetState<T> = Dispatch<SetStateAction<T>>;
export type ReactHTMLProps<T> = DetailedHTMLProps<HTMLAttributes<T>, T>;
