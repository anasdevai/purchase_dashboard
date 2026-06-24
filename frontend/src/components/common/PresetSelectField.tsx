import { FloatingSelect } from './FloatingSelect'

type PresetSelectFieldProps = {
  testId?: string
  label: string
  value: string
  presets: readonly string[]
  presetLabels?: Partial<Record<string, string>>
  otherLabel: string
  customPlaceholder: string
  error?: string
  onChange: (value: string) => void
}

export function PresetSelectField(props: PresetSelectFieldProps) {
  const preset = (props.presets as readonly string[]).includes(props.value) ? props.value : 'Other'

  return (
    <div>
      <label className="label">{props.label}</label>
      <FloatingSelect
        testId={props.testId}
        value={preset}
        options={[
          ...(props.presets as readonly string[])
            .filter((option) => option !== 'Other')
            .map((option) => ({
              value: option,
              label: props.presetLabels?.[option] ?? option,
            })),
          { value: 'Other', label: props.otherLabel },
        ]}
        onChange={(nextPreset) => {
          const isCustomCurrently = preset === 'Other'

          if (nextPreset === 'Other' && !isCustomCurrently) {
            props.onChange('')
          } else if (nextPreset !== 'Other') {
            props.onChange(nextPreset)
          }
        }}
      />
      {preset === 'Other' ? (
        <input
          className="input mt-2"
          data-testid={props.testId ? `${props.testId}-custom` : undefined}
          placeholder={props.customPlaceholder}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
        />
      ) : null}
      {props.error ? (
        <p
          className="mt-1 text-xs font-medium text-red-600"
          data-testid={props.testId ? `${props.testId}-error` : undefined}
        >
          {props.error}
        </p>
      ) : null}
    </div>
  )
}
