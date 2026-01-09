import { TextField, TextFieldProps } from '@mui/material'

const InputFormField = (props: TextFieldProps) => {
  return (
    <div className="flex items-center gap-4 w-full m-1">
      <TextField
        {...props}
        sx={{ borderWidth: 1 }}
        helperText={props.helperText || ' '}
        variant="outlined"
        fullWidth
        size="small"
      />
    </div>
  )
}

export const InputField = (props: TextFieldProps) => {
  return (
    <TextField
      {...props}
      sx={{ borderWidth: 1, marginBottom: 0 }}
      helperText={props.helperText || ' '}
      variant="outlined"
      fullWidth
      size="small"
    />
  )
}

export default InputFormField
