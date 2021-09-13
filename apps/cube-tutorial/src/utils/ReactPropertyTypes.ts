import type { TextField } from '@material-ui/core'
import type List from '@material-ui/core/List'
import type ListItem from '@material-ui/core/ListItem'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReturnType<T extends (props: any) => any> = T extends (props: infer P) => any ? P : never

export type HTMLDivProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export type TextFieldProps = ReturnType<typeof TextField>
export type ListItemProps = ReturnType<typeof ListItem>
export type ListProps = ReturnType<typeof List>
