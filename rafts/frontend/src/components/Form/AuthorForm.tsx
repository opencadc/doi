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
//Libs
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TAuthor, authorSchema } from '@/shared/model'
import { useEffect, useMemo, useState, useImperativeHandle, forwardRef, useCallback } from 'react'

// Hooks
import { useTranslations } from 'next-intl'
import { useSectionTutorial } from '@/hooks/useSectionTutorial'

// Constants
import {
  PROP_CONTRIBUTING_AUTHORS,
  PROP_COLLABORATIONS,
  PROP_CORRESPONDING_AUTHOR,
  PROP_AUTHOR_FIRST_NAME,
  PROP_AUTHOR_LAST_NAME,
  PROP_AUTHOR_AFFILIATION,
  PROP_AUTHOR_EMAIL,
  PROP_AUTHOR_ORCID,
} from '@/shared/constants'
import { EMPTY_AUTHOR } from '@/components/Form/constants'

// Components
import InputFormField from '@/components/Form/InputFormField'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import dynamic from 'next/dynamic'
import { Paper, IconButton, Tooltip } from '@mui/material'
import { HelpCircle } from 'lucide-react'
import type { Step } from 'react-joyride'

const SectionTutorial = dynamic(() => import('@/components/Tutorial/SectionTutorial'), {
  ssr: false,
})

export interface AuthorFormRef {
  getCurrentValues: () => TAuthor
}

const AuthorForm = forwardRef<
  AuthorFormRef,
  {
    onSubmitAuthor: (values: TAuthor) => void
    formIsDirty: (value: boolean) => void
    initialData?: TAuthor | null
  }
>(({ onSubmitAuthor, initialData = null, formIsDirty }, ref) => {
  const t = useTranslations('submission_form')
  const tTutorial = useTranslations('tutorial')

  // Tutorial setup
  const { run, stepIndex, handleJoyrideCallback, startTutorial } = useSectionTutorial({
    sectionName: 'author',
    autoStart: false,
  })

  // Tutorial steps
  const tutorialSteps: Step[] = useMemo(
    () => [
      {
        target: '.author-section-header',
        content: tTutorial('author_section_welcome'),
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.corresponding-author-section',
        content: tTutorial('author_corresponding'),
        placement: 'bottom',
      },
      {
        target: '.contributing-authors-section',
        content: tTutorial('author_contributing'),
        placement: 'bottom',
      },
      {
        target: '.collaborations-section',
        content: tTutorial('author_collaborations'),
        placement: 'bottom',
      },
      {
        target: '.add-author-button',
        content: tTutorial('author_add_button'),
        placement: 'top',
      },
      {
        target: '.save-author-button',
        content: tTutorial('author_save'),
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
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<TAuthor>({
    resolver: zodResolver(authorSchema),
    mode: 'onBlur',
    defaultValues: initialData || {
      [PROP_CORRESPONDING_AUTHOR]: EMPTY_AUTHOR,
      [PROP_CONTRIBUTING_AUTHORS]: [],
      [PROP_COLLABORATIONS]: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: PROP_CONTRIBUTING_AUTHORS,
  })

  // Track collaboration count locally to avoid watch() re-renders on every keystroke
  const [collaborationCount, setCollaborationCount] = useState(
    () => (initialData?.[PROP_COLLABORATIONS] || []).length,
  )

  const appendCollaboration = useCallback(() => {
    const current = getValues(PROP_COLLABORATIONS) || []
    setValue(PROP_COLLABORATIONS, [...current, ''])
    setCollaborationCount((c) => c + 1)
  }, [getValues, setValue])

  const removeCollaboration = useCallback(
    (index: number) => {
      const current = getValues(PROP_COLLABORATIONS) || []
      setValue(
        PROP_COLLABORATIONS,
        current.filter((_: string, i: number) => i !== index),
      )
      setCollaborationCount((c) => c - 1)
    },
    [getValues, setValue],
  )

  // Reset form with initialData when it changes (e.g., navigating back to this step)
  useEffect(() => {
    if (initialData) {
      reset(initialData)
      setCollaborationCount((initialData[PROP_COLLABORATIONS] || []).length)
    }
  }, [initialData, reset])

  useEffect(() => {
    formIsDirty(isDirty)
  }, [isDirty, formIsDirty])

  // Expose getCurrentValues via ref for parent to get form values before submit
  useImperativeHandle(ref, () => ({
    getCurrentValues: () => getValues(),
  }))

  const onSubmit = (data: TAuthor) => {
    onSubmitAuthor(data)
  }

  return (
    <>
      <SectionTutorial
        run={run}
        stepIndex={stepIndex}
        onCallback={handleJoyrideCallback}
        steps={tutorialSteps}
        sectionName="author"
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
          <h2 className="author-section-header text-lg font-bold text-center">
            {t('author_info')}
          </h2>
          <p className="text-sm text-gray-500 text-center">{t('author_info_helper')}</p>

          {/* Corresponding Author */}
          <fieldset className="corresponding-author-section border p-4 rounded">
            <legend className="font-semibold">{t('cor_author')}</legend>

            <div>
              <InputFormField
                label={t('first_name')}
                error={!!errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_FIRST_NAME]}
                helperText={
                  errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_FIRST_NAME]
                    ? t(errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_FIRST_NAME]?.message)
                    : undefined
                }
                required={true}
                {...register(`${PROP_CORRESPONDING_AUTHOR}.${PROP_AUTHOR_FIRST_NAME}`, {
                  required: t('is_required'),
                })}
              />
            </div>

            <div>
              <InputFormField
                label={t('last_name')}
                error={!!errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_LAST_NAME]}
                helperText={
                  errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_LAST_NAME]
                    ? t(errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_LAST_NAME]?.message)
                    : undefined
                }
                required={true}
                {...register(`${PROP_CORRESPONDING_AUTHOR}.${PROP_AUTHOR_LAST_NAME}`, {
                  required: t('is_required'),
                })}
              />
            </div>
            <div>
              <InputFormField
                label={t('author_ORCID')}
                placeholder="0000-0000-0000-0000"
                error={!!errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_ORCID]}
                helperText={
                  errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_ORCID]
                    ? t(errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_ORCID]?.message)
                    : undefined
                }
                {...register(`${PROP_CORRESPONDING_AUTHOR}.${PROP_AUTHOR_ORCID}`)}
              />
            </div>

            <div>
              <InputFormField
                label={t('affiliation')}
                error={!!errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_AFFILIATION]}
                helperText={
                  errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_AFFILIATION]
                    ? t(errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_AFFILIATION]?.message)
                    : undefined
                }
                required={true}
                {...register(`${PROP_CORRESPONDING_AUTHOR}.${PROP_AUTHOR_AFFILIATION}`, {
                  required: t('is_required'),
                })}
              />
            </div>

            <div>
              <InputFormField
                label={t('email')}
                error={!!errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_EMAIL]}
                helperText={
                  errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_EMAIL]
                    ? t(errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_EMAIL]?.message)
                    : undefined
                }
                required={true}
                {...register(`${PROP_CORRESPONDING_AUTHOR}.${PROP_AUTHOR_EMAIL}`, {
                  required: t('is_required'),
                })}
              />
            </div>
          </fieldset>

          {/* Contributing Authors */}
          <fieldset className="contributing-authors-section border p-4 rounded">
            <legend className="font-semibold">{t('con_authors')}</legend>

            {fields.map((field, index) => (
              <div key={field.id} className="border p-2 rounded mb-2">
                <div>
                  <InputFormField
                    label={t('first_name')}
                    error={!!errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_FIRST_NAME]}
                    helperText={
                      errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_FIRST_NAME]
                        ? t(
                            errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_FIRST_NAME]
                              ?.message,
                          )
                        : undefined
                    }
                    required={true}
                    {...register(
                      `${PROP_CONTRIBUTING_AUTHORS}.${index}.${PROP_AUTHOR_FIRST_NAME}`,
                      {
                        required: t('is_required'),
                      },
                    )}
                  />
                </div>

                <div>
                  <InputFormField
                    label={t('last_name')}
                    error={!!errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_LAST_NAME]}
                    helperText={
                      errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_LAST_NAME]
                        ? t(
                            errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_LAST_NAME]
                              ?.message,
                          )
                        : undefined
                    }
                    required={true}
                    {...register(`${PROP_CONTRIBUTING_AUTHORS}.${index}.${PROP_AUTHOR_LAST_NAME}`, {
                      required: t('is_required'),
                    })}
                  />
                </div>
                <div>
                  <InputFormField
                    label={t('author_ORCID')}
                    placeholder="0000-0000-0000-0000"
                    error={!!errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_ORCID]}
                    helperText={
                      errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_ORCID]
                        ? t(
                            errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_ORCID]
                              ?.message,
                          )
                        : undefined
                    }
                    {...register(`${PROP_CONTRIBUTING_AUTHORS}.${index}.${PROP_AUTHOR_ORCID}`)}
                  />
                </div>

                <div>
                  <InputFormField
                    label={t('affiliation')}
                    error={!!errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_AFFILIATION]}
                    helperText={
                      errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_AFFILIATION]
                        ? t(
                            errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_AFFILIATION]
                              ?.message,
                          )
                        : undefined
                    }
                    required={true}
                    {...register(
                      `${PROP_CONTRIBUTING_AUTHORS}.${index}.${PROP_AUTHOR_AFFILIATION}`,
                      {
                        required: t('is_required'),
                      },
                    )}
                  />
                </div>

                <div>
                  <InputFormField
                    label={t('email')}
                    error={!!errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_EMAIL]}
                    helperText={
                      errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_EMAIL]
                        ? t(
                            errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_EMAIL]
                              ?.message,
                          )
                        : undefined
                    }
                    required={true}
                    {...register(`${PROP_CONTRIBUTING_AUTHORS}.${index}.${PROP_AUTHOR_EMAIL}`, {
                      required: t('is_required'),
                    })}
                  />
                </div>
                <div className={'flex justify-end'}>
                  <Button
                    size={'small'}
                    variant="text"
                    endIcon={<DeleteIcon />}
                    onClick={() => remove(index)}
                  >
                    {t('remove')}
                  </Button>
                </div>
              </div>
            ))}

            <Button
              className="add-author-button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => append(EMPTY_AUTHOR)}
            >
              {t('add_author')}
            </Button>
          </fieldset>

          {/* Collaborations */}
          <fieldset className="collaborations-section border p-4 rounded">
            <legend className="font-semibold">{t('collaborations')}</legend>

            {Array.from({ length: collaborationCount }, (_, index) => (
              <div
                key={`collaboration-${index}`}
                className="border p-2 rounded flex flex-col items-start justify-start"
              >
                <InputFormField
                  label={t('collaboration_name')}
                  error={!!errors[PROP_COLLABORATIONS]?.[index]}
                  helperText={
                    errors[PROP_COLLABORATIONS]?.[index]
                      ? t(errors[PROP_COLLABORATIONS]?.[index]?.message)
                      : undefined
                  }
                  required={true}
                  {...register(`${PROP_COLLABORATIONS}.${index}`, {
                    required: t('is_required'),
                  })}
                />

                <Button
                  className="self-end"
                  size={'small'}
                  variant="text"
                  endIcon={<DeleteIcon />}
                  onClick={() => removeCollaboration(index)}
                >
                  {t('remove')}
                </Button>
              </div>
            ))}

            <Button
              className="add-collaboration-button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={appendCollaboration}
            >
              {t('add_collaboration')}
            </Button>
          </fieldset>

          <Button
            className="save-author-button"
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

AuthorForm.displayName = 'AuthorForm'

export default AuthorForm
