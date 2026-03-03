/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TMiscInfo, miscInfoSchema } from '@/shared/model'
import { useEffect, useMemo, useImperativeHandle, forwardRef } from 'react'

// Hooks
import { useTranslations } from 'next-intl'
import { useSectionTutorial } from '@/hooks/useSectionTutorial'

// Constants
import { PROP_MISC, PROP_MISC_KEY, PROP_MISC_VALUE, PROP_MISC_TYPE } from '@/shared/constants'

// Components
import InputFormField from '@/components/Form/InputFormField'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import { Paper, IconButton, Tooltip, Typography, ButtonGroup, Chip } from '@mui/material'
import { HelpCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { Step } from 'react-joyride'

const SectionTutorial = dynamic(() => import('@/components/Tutorial/SectionTutorial'), {
  ssr: false,
})
import TextFileUpload from '@/components/Form/FileUpload/TextFileUpload'
import { FileReference, isFileReference, parseStoredAttachment } from '@/types/attachments'

const EMPTY_TEXT_ITEM = {
  [PROP_MISC_KEY]: '',
  [PROP_MISC_VALUE]: '',
  [PROP_MISC_TYPE]: 'text' as const,
}

const EMPTY_FILE_ITEM = {
  [PROP_MISC_KEY]: '',
  [PROP_MISC_VALUE]: '',
  [PROP_MISC_TYPE]: 'file' as const,
}

export interface MiscellaneousInfoFormRef {
  getCurrentValues: () => TMiscInfo
}

const MiscellaneousInfoForm = forwardRef<
  MiscellaneousInfoFormRef,
  {
    onSubmitMiscellaneous: (values: TMiscInfo) => void
    formIsDirty: (value: boolean) => void
    initialData?: TMiscInfo | null
    doiIdentifier?: string | null
  }
>(({ onSubmitMiscellaneous, initialData = null, formIsDirty, doiIdentifier }, ref) => {
  const t = useTranslations('submission_form')
  const tTutorial = useTranslations('tutorial')

  // Tutorial setup
  const { run, stepIndex, handleJoyrideCallback, startTutorial } = useSectionTutorial({
    sectionName: 'misc',
    autoStart: false,
  })

  // Tutorial steps
  const tutorialSteps: Step[] = useMemo(
    () => [
      {
        target: '.misc-section-header',
        content: tTutorial('misc_section_welcome'),
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.key-value-section',
        content: tTutorial('misc_key_value'),
        placement: 'bottom',
      },
      {
        target: '.add-misc-button',
        content: tTutorial('misc_additional_files'),
        placement: 'top',
      },
      {
        target: '.save-misc-button',
        content: tTutorial('misc_save'),
        placement: 'top',
      },
    ],
    [tTutorial],
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<TMiscInfo>({
    resolver: zodResolver(miscInfoSchema),
    mode: 'onBlur',
    defaultValues: initialData || {
      [PROP_MISC]: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: PROP_MISC,
  })

  // Reset form with initialData when it changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  useEffect(() => {
    formIsDirty(isDirty)
  }, [isDirty, formIsDirty])

  // Expose getCurrentValues via ref for parent to get form values before submit
  useImperativeHandle(ref, () => ({
    getCurrentValues: () => getValues(),
  }))

  const onSubmit = (data: TMiscInfo) => {
    onSubmitMiscellaneous(data)
  }

  // Count file-type entries
  const watchedFields = watch(PROP_MISC)
  const fileCount = useMemo(
    () => watchedFields?.filter((f) => f?.[PROP_MISC_TYPE] === 'file').length ?? 0,
    [watchedFields],
  )

  const serializeAttachmentValue = (data: string | FileReference): string => {
    if (isFileReference(data)) {
      return JSON.stringify(data)
    }
    return data
  }

  return (
    <>
      <SectionTutorial
        run={run}
        stepIndex={stepIndex}
        onCallback={handleJoyrideCallback}
        steps={tutorialSteps}
        sectionName="misc"
      />
      <Paper className="relative">
        {/* Tutorial Help Button */}
        <div className="absolute top-2 right-2 z-10">
          <Tooltip title={tTutorial('section_help')} arrow>
            <IconButton
              size="small"
              onClick={startTutorial}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <HelpCircle size={20} />
            </IconButton>
          </Tooltip>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-4 w-full max-w-lg mx-auto"
        >
          <h2 className="misc-section-header text-lg font-bold text-center">
            {t('miscellaneous_info')}
            {fileCount > 0 && (
              <Chip
                label={`${fileCount} ${fileCount === 1 ? t('misc_file') : t('misc_files')}`}
                size="small"
                sx={{ ml: 1, verticalAlign: 'middle' }}
              />
            )}
          </h2>

          <div className="key-value-section flex flex-col gap-4">
            {fields.map((field, index) => {
              const entryType = watchedFields?.[index]?.[PROP_MISC_TYPE] || 'text'
              const isFileType = entryType === 'file'

              return (
                <div key={field.id} className="border p-4 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <Typography variant="caption" color="text.secondary">
                      {isFileType ? t('misc_file_entry') : t('misc_text_entry')}
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      endIcon={<DeleteIcon />}
                      onClick={() => remove(index)}
                    >
                      {t('remove')}
                    </Button>
                  </div>
                  {/* Hidden field for miscType */}
                  <input type="hidden" {...register(`${PROP_MISC}.${index}.${PROP_MISC_TYPE}`)} />
                  <div className="space-y-4">
                    <InputFormField
                      label={isFileType ? t('misc_file_label') : t('misc_key')}
                      error={!!errors?.[PROP_MISC]?.[index]?.[PROP_MISC_KEY]}
                      helperText={
                        errors?.[PROP_MISC]?.[index]?.[PROP_MISC_KEY]
                          ? t(errors?.[PROP_MISC]?.[index]?.[PROP_MISC_KEY]?.message)
                          : isFileType
                            ? t('misc_file_label_helper')
                            : t('misc_key_helper')
                      }
                      {...register(`${PROP_MISC}.${index}.${PROP_MISC_KEY}`)}
                    />

                    {isFileType ? (
                      <TextFileUpload
                        label={t('misc_upload_file')}
                        hint={t('misc_upload_hint')}
                        onFileLoaded={(data) => {
                          setValue(
                            `${PROP_MISC}.${index}.${PROP_MISC_VALUE}`,
                            serializeAttachmentValue(data),
                          )
                        }}
                        onClear={() => {
                          setValue(`${PROP_MISC}.${index}.${PROP_MISC_VALUE}`, '')
                        }}
                        initialText={parseStoredAttachment(
                          watchedFields?.[index]?.[PROP_MISC_VALUE],
                        )}
                        doiIdentifier={doiIdentifier || undefined}
                        customFilename={`misc_${index + 1}`}
                      />
                    ) : (
                      <InputFormField
                        label={t('misc_value')}
                        error={!!errors?.[PROP_MISC]?.[index]?.[PROP_MISC_VALUE]}
                        helperText={
                          errors?.[PROP_MISC]?.[index]?.[PROP_MISC_VALUE]
                            ? t(errors?.[PROP_MISC]?.[index]?.[PROP_MISC_VALUE]?.message)
                            : t('misc_value_helper')
                        }
                        {...register(`${PROP_MISC}.${index}.${PROP_MISC_VALUE}`)}
                      />
                    )}
                  </div>
                </div>
              )
            })}

            <ButtonGroup variant="outlined" className="add-misc-button">
              <Button startIcon={<AddIcon />} onClick={() => append(EMPTY_TEXT_ITEM)}>
                {t('add_text_item')}
              </Button>
              <Button startIcon={<AddIcon />} onClick={() => append(EMPTY_FILE_ITEM)}>
                {t('add_file_item')}
              </Button>
            </ButtonGroup>
          </div>

          <Button
            className="save-misc-button"
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {t('save')}
          </Button>
        </form>
      </Paper>
    </>
  )
})

MiscellaneousInfoForm.displayName = 'MiscellaneousInfoForm'

export default MiscellaneousInfoForm
