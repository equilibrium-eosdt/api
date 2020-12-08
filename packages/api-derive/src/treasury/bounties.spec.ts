// Copyright 2017-2020 @polkadot/api authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { fetchBounties } from '@polkadot/api-derive/treasury/bounties';
import { ApiInterfaceRx } from '@polkadot/api/types';
import { Bytes, Option, StorageKey } from '@polkadot/types';
import { Bounty, BountyIndex } from '@polkadot/types/interfaces';
import { Codec, InterfaceTypes } from '@polkadot/types/types';
import { of } from 'rxjs';
import { BountyFactory } from '../../test/bountyFactory';
import { BytesFactory } from '../../test/bytesFactory';
import { createApiWithAugmentations } from '../../test/helpers';

const DEFAULT_PROPOSER = '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM';

describe('bounties derive', () => {
  let storageKey: (index: number) => StorageKey;
  let defaultBounty: () => Bounty;
  let emptyOption: <T extends Codec> (typeName: keyof InterfaceTypes) => Option<T>;
  let optionOf: <T extends Codec> (value: T)=> Option<T>;
  let bountyIndex: (index: number) => BountyIndex;
  let bytes: (value: string) => Bytes;

  beforeAll(() => {
    const api = createApiWithAugmentations();

    ({ bountyIndex, defaultBounty, emptyOption, optionOf, storageKey } = new BountyFactory(api));
    ({ bytes } = new BytesFactory(api.registry));
  });

  it('combines bounties with descriptions', async () => {
    const mockApi = {
      query: {
        treasury: {
          bounties: {
            keys: () => of([storageKey(0), storageKey(1), storageKey(2)]),
            multi: () => of([optionOf(defaultBounty()), emptyOption('Bounty'), optionOf(defaultBounty())])
          },
          bountyCount: () => of(bountyIndex(3)),
          bountyDescriptions: {
            multi: () => of([
              optionOf(bytes('make polkadot even better')),
              optionOf(bytes('this will be totally ignored')),
              emptyOption('Bytes')
            ])
          }
        }
      }
    } as unknown as ApiInterfaceRx;

    const bounties = await fetchBounties(mockApi).toPromise();

    expect(bounties.bountyDescriptions).toHaveLength(2);
    expect(bounties.bounties).toHaveLength(2);
    expect(bounties.bounties[0].proposer.toString()).toEqual(DEFAULT_PROPOSER);
    expect(bounties.bountyDescriptions[0].toHuman()).toEqual('make polkadot even better');
    expect(bounties.bounties[1].proposer.toString()).toEqual(DEFAULT_PROPOSER);
    expect(bounties.bountyDescriptions[1].toHuman()).toEqual('');
  });
});
