import type TextField from '@mui/material/TextField'
import type List from '@mui/material/List'
import type ListItem from '@mui/material/ListItem'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReturnType<T extends (props: any) => any> = T extends (props: infer P) => any ? P : never

export type HTMLDivProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export type TextFieldProps = ReturnType<typeof TextField>
export type ListItemProps = ReturnType<typeof ListItem>
export type ListProps = ReturnType<typeof List>
