import { NextResponse } from 'next/server';
import { getHouseholdById, getResidentsByHousehold } from '@/_lib/residentService';
import { getSession } from '@/_lib/auth';

/**
 * GET /api/households/[householdId]
 *
 * Returns the household record AND its current members.
 * Used by the Add Resident form to auto-fill "Household Head Name"
 * and show who is already in the household.
 *
 * Response 200: { household_id, house_id, kebele_id, head_name, members: [...] }
 * Response 404: { message }
 */
export async function GET(request, { params }) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { householdId } = await params;
  
  const household = await getHouseholdById(householdId);
  if (!household) {
    return NextResponse.json(
      { message: `Household "${householdId}" not found.` },
      { status: 404 }
    );
  }

  const members = await getResidentsByHousehold(householdId);

  return NextResponse.json({ ...household, members });
}