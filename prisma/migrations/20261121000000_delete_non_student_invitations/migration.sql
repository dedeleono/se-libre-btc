-- Invitations are only ever issued for students. Any other role can only have come from the
-- unauthenticated invite route that plan 002 removed, so those rows are deleted before they can be redeemed.
DELETE FROM "PendingInvitation" WHERE "role" <> 'STUDENT';
