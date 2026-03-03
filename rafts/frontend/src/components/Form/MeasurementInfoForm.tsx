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

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TMeasurementInfo, measurementInfoSchema } from '@/shared/model'
import { useEffect } from 'react'

// Hooks
import { useTranslations } from 'next-intl'

// Constants
import {
  PROP_PHOTOMETRY,
  PROP_SPECTROSCOPY,
  PROP_ASTROMETRY,
  PROP_WAVELENGTH,
  PROP_BRIGHTNESS,
  PROP_FLUX,
  PROP_ERRORS,
  PROP_POSITION,
  PROP_TIME_OBSERVED,
} from '@/shared/constants'

// Components
import InputFormField from '@/components/Form/InputFormField'
import Button from '@mui/material/Button'
import SaveIcon from '@mui/icons-material/Save'
import { Paper } from '@mui/material'

const MeasurementInfoForm = ({
  onSubmitMeasurement,
  initialData = null,
  formIsDirty,
}: {
  onSubmitMeasurement: (values: TMeasurementInfo) => void
  formIsDirty: (value: boolean) => void
  initialData?: TMeasurementInfo | null
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<TMeasurementInfo>({
    resolver: zodResolver(measurementInfoSchema),
    defaultValues: initialData || {
      [PROP_PHOTOMETRY]: {
        [PROP_WAVELENGTH]: '',
        [PROP_BRIGHTNESS]: '',
        [PROP_ERRORS]: '',
      },
      [PROP_SPECTROSCOPY]: {
        [PROP_WAVELENGTH]: '',
        [PROP_FLUX]: '',
        [PROP_ERRORS]: '',
      },
      [PROP_ASTROMETRY]: {
        [PROP_POSITION]: '',
        [PROP_TIME_OBSERVED]: '',
      },
    },
  })

  const t = useTranslations('submission_form')

  // Reset form with initialData when it changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  useEffect(() => {
    formIsDirty(isDirty)
  }, [isDirty, formIsDirty])

  const onSubmit = (data: TMeasurementInfo) => {
    onSubmitMeasurement(data)
  }

  return (
    <Paper>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 p-4 w-full max-w-lg mx-auto"
      >
        <h2 className="text-lg font-bold text-center">{t('measurement_info')}</h2>

        {/* Photometry Section */}
        <fieldset className="border p-4 rounded">
          <legend className="font-semibold">{t('photometry')}</legend>

          <div className="space-y-4">
            <InputFormField
              label={t('wavelength')}
              error={!!errors.photometry?.wavelength}
              helperText={
                errors.photometry?.wavelength
                  ? t(errors.photometry?.wavelength?.message)
                  : undefined
              }
              {...register(`${PROP_PHOTOMETRY}.${PROP_WAVELENGTH}`)}
            />

            <InputFormField
              label={t('brightness')}
              error={!!errors.photometry?.brightness}
              helperText={
                errors.photometry?.brightness
                  ? t(errors.photometry?.brightness?.message)
                  : undefined
              }
              {...register(`${PROP_PHOTOMETRY}.${PROP_BRIGHTNESS}`)}
            />

            <InputFormField
              label={`${t('errors')} (${t('optional')})`}
              error={!!errors.photometry?.errors}
              helperText={
                errors.photometry?.errors ? t(errors.photometry?.errors?.message) : undefined
              }
              {...register(`${PROP_PHOTOMETRY}.${PROP_ERRORS}`)}
            />
          </div>
        </fieldset>

        {/* Spectroscopy Section */}
        <fieldset className="border p-4 rounded">
          <legend className="font-semibold">{t('spectroscopy')}</legend>

          <div className="space-y-4">
            <InputFormField
              label={t('wavelength')}
              error={!!errors.spectroscopy?.wavelength}
              helperText={
                errors.spectroscopy?.wavelength
                  ? t(errors.spectroscopy?.wavelength?.message)
                  : undefined
              }
              {...register(`${PROP_SPECTROSCOPY}.${PROP_WAVELENGTH}`)}
            />

            <InputFormField
              label={t('flux')}
              error={!!errors.spectroscopy?.flux}
              helperText={
                errors.spectroscopy?.flux ? t(errors.spectroscopy?.flux?.message) : undefined
              }
              {...register(`${PROP_SPECTROSCOPY}.${PROP_FLUX}`)}
            />

            <InputFormField
              label={`${t('errors')} (${t('optional')})`}
              error={!!errors.spectroscopy?.errors}
              helperText={
                errors.spectroscopy?.errors ? t(errors.spectroscopy?.errors?.message) : undefined
              }
              {...register(`${PROP_SPECTROSCOPY}.${PROP_ERRORS}`)}
            />
          </div>
        </fieldset>

        {/* Astrometry Section */}
        <fieldset className="border p-4 rounded">
          <legend className="font-semibold">{t('astrometry')}</legend>

          <div className="space-y-4">
            <InputFormField
              label={`${t('position')} (${t('optional')})`}
              error={!!errors.astrometry?.position}
              helperText={
                errors.astrometry?.position ? t(errors.astrometry?.position?.message) : undefined
              }
              {...register(`${PROP_ASTROMETRY}.${PROP_POSITION}`)}
            />

            <InputFormField
              label={`${t('time_observed')} (${t('optional')})`}
              error={!!errors.astrometry?.timeObserved}
              helperText={
                errors.astrometry?.timeObserved
                  ? t(errors.astrometry?.timeObserved?.message)
                  : undefined
              }
              {...register(`${PROP_ASTROMETRY}.${PROP_TIME_OBSERVED}`)}
            />
          </div>
        </fieldset>

        {/* Submit Button */}
        <Button type="submit" variant="contained" startIcon={<SaveIcon />} className="mt-4">
          {t('save')}
        </Button>
      </form>
    </Paper>
  )
}
export default MeasurementInfoForm
